import { readFileSync } from 'fs-extra';
import { App, FileSystemAdapter, resolveSubpath, TFile } from 'obsidian';
import path from 'path';
import {
    SlidesExtendedSettings as SlidesExtendedSettings,
    ImageCollector,
} from '../@types';
import { DISABLED_IMAGE_COLLECTOR } from '../slidesExtended-constants';
import { MarkdownProcessor } from './markdownProcessor';

let instance: ImageCollector = DISABLED_IMAGE_COLLECTOR;
export function getImageCollector(): ImageCollector {
    return instance;
}

function setImageCollector(newInstance: ImageCollector) {
    instance = newInstance;
}

export class ObsidianUtils implements ImageCollector {
    private app: App;
    private fileSystem: FileSystemAdapter;
    private settings: SlidesExtendedSettings;
    private readonly processor: MarkdownProcessor;
    private readonly vaultDir;
    private readonly pluginDir;
    private readonly distDir;
    private readonly exportDir;
    private readonly cssSearchPath;
    private readonly highlightSearchPath;
    private readonly themeSearchPath;
    private readonly htmlTemplateSearchPath;

    private images = new Set<string>();
    private isCollecting = false;

    private yamlRegex = /^---.*?---\n(.*?)($|---)/s;

    constructor(app: App, settings: SlidesExtendedSettings) {
        this.app = app;
        if (!(this.app.vault.adapter instanceof FileSystemAdapter)) {
            throw new Error('Slides Extended is only supported on the desktop');
        }

        this.fileSystem = this.app.vault.adapter;
        this.settings = settings;
        this.vaultDir = this.fileSystem.getBasePath() + '/';
        this.pluginDir = path.join(
            this.vaultDir,
            this.app.vault.configDir,
            'plugins/slides-extended/',
        );
        this.distDir = path.join(this.pluginDir, 'dist/');
        this.exportDir = path.join(
            this.vaultDir,
            this.settings.exportDirectory,
        );

        this.cssSearchPath = [
            path.join(this.pluginDir), // relative to plugin dir
        ];
        this.highlightSearchPath = [
            path.join(this.pluginDir, 'plugin/highlight'),
        ];
        this.themeSearchPath = [
            path.join(this.pluginDir, 'css'), // plugin layouts
            path.join(this.distDir, 'theme'), // reveal.js themes
        ];
        this.htmlTemplateSearchPath = [path.join(this.pluginDir, 'template')];

        if (this.settings.themeDirectory) {
            const vaultThemeDir = path.join(
                this.vaultDir,
                this.settings.themeDirectory,
            );
            this.cssSearchPath.unshift(vaultThemeDir);
            this.highlightSearchPath.unshift(vaultThemeDir);
            this.themeSearchPath.unshift(vaultThemeDir);
            this.htmlTemplateSearchPath.unshift(vaultThemeDir + '/html');
        }

        setImageCollector(this);
        this.processor = new MarkdownProcessor(this);
    }

    get markdownProcessor(): MarkdownProcessor {
        return this.processor;
    }

    get vaultName(): string {
        return this.fileSystem.getName();
    }
    get vaultDirectory(): string {
        return this.vaultDir;
    }

    get pluginDirectory(): string {
        return this.pluginDir;
    }

    get distDirectory(): string {
        return this.distDir;
    }

    get exportDirectory(): string {
        return this.exportDir;
    }

    getLocalCssSearchPath(): string[] {
        return this.cssSearchPath;
    }

    getThemeSearchPath(): string[] {
        return this.themeSearchPath;
    }
    getHighlightSearchPath(): string[] {
        return this.highlightSearchPath;
    }
    getHtmlTemplateSearchPath(): string[] {
        return this.htmlTemplateSearchPath;
    }

    getSettings(): SlidesExtendedSettings {
        return this.settings;
    }

    private getTFile(filename: string): TFile | null {
        if (filename.startsWith('[[') && filename.endsWith(']]')) {
            filename = filename.substring(2, filename.length - 2).trim();
        }

        const expDir = this.settings.exportDirectory.startsWith('/')
            ? this.settings.exportDirectory.substring(1)
            : this.settings.exportDirectory;

        const allFiles = this.app.vault.getFiles();
        const filesNotInExportDir = allFiles.filter(
            item => !item.path.contains(expDir),
        );
        const allHits = filesNotInExportDir.filter(item =>
            item.path.contains(filename),
        );

        let file: TFile = null;

        // Only one match
        if (allHits.length == 1) {
            file = allHits.first();
        }

        // Workaround for Excalidraw images
        if (!file && filename.toLowerCase().endsWith('.excalidraw')) {
            let hit = filesNotInExportDir.filter(x =>
                x.path.contains(filename + '.svg'),
            );
            if (hit) {
                file = hit.first();
            } else {
                hit = filesNotInExportDir.filter(x =>
                    x.path.contains(filename + '.png'),
                );
                if (hit) {
                    file = hit.first();
                }
            }
        }

        // Find file most similar to search term
        if (!file && allHits.length > 1) {
            let score = 0;
            for (const hit of allHits) {
                const currentScore = this.similarity(filename, hit.path);
                if (currentScore > score) {
                    score = currentScore;
                    file = hit;
                }
            }
        }

        return file;
    }

    getAbsolutePath(relativePath: string): string {
        const markdownFile = this.getTFile(relativePath);
        return this.absolute(markdownFile?.path);
    }

    getRelativePath(path: string): string | null {
        if (path == null) {
            return null;
        }
        const file = this.getTFile(path);
        return file?.path;
    }

    absolute(relativePath: string) {
        if (relativePath) return this.fileSystem.getFullPath(relativePath);
        else {
            return null;
        }
    }

    findFile(path: string) {
        let base = '';
        if (!getImageCollector().shouldCollect()) {
            base = '/';
        }
        const file: TFile = this.getTFile(path);
        if (file) {
            return base + file.path;
        } else {
            return path;
        }
    }

    parseFile(filename: string, header: string) {
        const tfile = this.getTFile(filename);

        if (!tfile) {
            return null;
        }

        const absoluteFilePath = this.absolute(tfile?.path);
        const fileContent = readFileSync(absoluteFilePath, {
            encoding: 'utf-8',
        });

        if (header === null) {
            if (this.yamlRegex.test(fileContent)) {
                return this.yamlRegex.exec(fileContent)[1];
            } else {
                return fileContent;
            }
        } else {
            const cache = this.app.metadataCache.getFileCache(tfile);
            const resolved = resolveSubpath(cache, header);

            if (resolved && resolved.start && resolved.start.line != null) {
                if (resolved.end && resolved.end.line != null) {
                    return this.substring(
                        fileContent,
                        resolved.start.line,
                        resolved.start.col,
                        resolved.end.line,
                        resolved.end.col,
                    );
                } else {
                    return this.substring(
                        fileContent,
                        resolved.start.line,
                        resolved.start.col,
                        -1,
                        -1,
                    );
                }
            } else {
                return '![[' + filename + '#' + header + ']]';
            }
        }
    }

    substring(
        input: string,
        startLine: number,
        startColumn: number,
        endLine: number,
        endColumn: number,
    ): string {
        let result = '';
        const lines = input.split('\n');

        let eline = lines.length;
        if (endLine > -1) {
            eline = endLine;
        }

        for (let index = startLine; index <= eline; index++) {
            const line = lines[index];
            if (line != null) {
                if (index == startLine) {
                    result += line.substring(startColumn) + '\n';
                } else if (index == eline) {
                    let endLine = line;
                    if (endColumn > -1) {
                        endLine = line.substring(0, endColumn);
                    }
                    if (endLine.includes('^')) {
                        endLine = endLine.substring(
                            0,
                            endLine.lastIndexOf('^'),
                        );
                    }
                    result += endLine + '\n';
                } else {
                    result += line + '\n';
                }
            }
        }

        return result;
    }

    similarity(s1: string, s2: string): number {
        let longer = s1;
        let shorter = s2;
        if (s1.length < s2.length) {
            longer = s2;
            shorter = s1;
        }
        const longerLength = longer.length;
        if (longerLength == 0) {
            return 1.0;
        }
        return (
            (longerLength - this.editDistance(longer, shorter)) / longerLength
        );
    }

    editDistance(s1: string, s2: string): number {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();

        const costs = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i == 0) costs[j] = j;
                else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (s1.charAt(i - 1) != s2.charAt(j - 1))
                            newValue =
                                Math.min(
                                    Math.min(newValue, lastValue),
                                    costs[j],
                                ) + 1;
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }

    resetImageCollection() {
        console.debug(
            'enable image collection for exported slides, start collecting',
        );
        this.images.clear();
        this.isCollecting = true;
    }

    disableImageCollection() {
        console.debug('stop collecting images', this.images);
        this.isCollecting = false;
    }

    // ImageCollector
    addImage(filePath: string): void {
        this.images.add(filePath);
    }

    getAll(): string[] {
        return Array.of(...this.images);
    }

    shouldCollect(): boolean {
        return this.isCollecting;
    }
}
