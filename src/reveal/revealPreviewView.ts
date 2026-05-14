import {
    ItemView,
    MarkdownView,
    type Menu,
    type TFile,
    type WorkspaceLeaf,
} from "obsidian";
import type { SlidesExtendedPlugin } from "src/slidesExtended-Plugin";
import type { Options, SlidesExtendedSettings } from "../@types";
import { YamlParser } from "../yaml/yamlParser";

export const REVEAL_PREVIEW_VIEW = "reveal-preview-view";

export class RevealPreviewView extends ItemView {
    url = "about:blank";
    private home: URL;
    private onCloseListener: () => void;

    private urlRegex = /#\/(\d*)(?:\/(\d*))?(?:\/(\d*))?/;
    private yaml: YamlParser;
    private plugin: SlidesExtendedPlugin;

    private expandedCache: {
        masterPath: string;
        expandedMarkdown: string;
        lineMap: Array<{ filename: string; localLine: number }>;
        masterEmbedLines: Map<number, number>;
        separators: Options;
        masterYamlLineOffset: number;
        chapterYamlOffsets: Map<string, number>;
    } | null = null;

    constructor(
        leaf: WorkspaceLeaf,
        home: URL,
        plugin: SlidesExtendedPlugin,
        settings: SlidesExtendedSettings,
        onCloseListener: () => void,
    ) {
        super(leaf);
        this.home = home;
        this.yaml = new YamlParser(settings);
        this.plugin = plugin;
        this.onCloseListener = onCloseListener;

        this.addAction("globe", "Open in browser", () => {
            this.openInBrowser();
        });

        this.addAction("grid", "Show grid", () => {
            settings.showGrid = !settings.showGrid;
            this.reloadIframe();
        });

        this.addAction("refresh", "Refresh slides", () => {
            this.reloadIframe();
        });

        if (settings.paneMode === "sidebar") {
            this.addAction("monitor-x", "Close preview", () => {
                this.leaf.detach();
            });
        }

        window.addEventListener("message", this.onMessage.bind(this));

        this.registerEvent(
            this.app.vault.on("modify", () => {
                this.expandedCache = null;
            }),
        );

        this.registerEvent(
            this.app.workspace.on("active-leaf-change", (leaf: WorkspaceLeaf | null) => {
                if (!(leaf?.view instanceof MarkdownView)) return;
                this.onLineChanged((leaf.view as MarkdownView).editor.getCursor().line);
            }),
        );
    }

    onPaneMenu(
        menu: Menu,
        source: "more-options" | "tab-header" | string,
    ): void {
        super.onPaneMenu(menu, source);

        if (source !== "more-options") {
            return;
        }

        menu.addSeparator();
        menu.addItem((item) => {
            item.setIcon("document")
                .setTitle("Print presentation")
                .onClick(() => this.printPresentation());
        });
        menu.addItem((item) => {
            item.setIcon("install")
                .setTitle("Export as html")
                .onClick(() => this.exportAsHtml());
        });
    }

    openInBrowser() {
        window.open(this.home);
    }

    printPresentation() {
        window.open(`${this.home.toString()}?print-pdf`);
    }

    exportAsHtml() {
        const url = new URL(this.url);
        url.searchParams.set("export", "true");
        this.setUrl(url.toString());
    }

    onMessage(msg: MessageEvent) {
        if (msg.data.includes("?export")) {
            this.setUrl(msg.data.split("?")[0]);
            return;
        }

        this.setUrl(msg.data, false);

        const url = new URL(msg.data);
        let filename = decodeURI(url.pathname);
        filename = filename.substring(filename.lastIndexOf("/") + 1);

        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view?.file.name.includes(filename)) {
            const line = this.getTargetLine(url, view.data);
            // line will be undefined for embedded content
            if (line) {
                view.editor.setCursor(view.editor.lastLine());
                view.editor.setCursor({ line: line, ch: 0 });
            }
        }
    }

    onLineChanged(line: number) {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        const viewContent = this.containerEl.children[1];
        const iframe = viewContent.getElementsByTagName("iframe")[0];

        if (view && iframe) {
            const masterFile = this.getMasterFile();
            const isChapterFile = masterFile !== null &&
                this.normalizeFilename(view.file.name) !== this.normalizeFilename(masterFile.name);
            const [x, y] = isChapterFile
                ? this.getTargetSlideMultiFile(line, view, masterFile)
                : this.getTargetSlide(line, view.data);
            iframe.contentWindow.postMessage(
                `{"method":"setState","args":[{"indexh":${x},"indexv":${y},"paused":false}]}`,
                this.url,
            );
        }
    }

    getTargetSlide(line: number, source: string): [number, number] {
        const { yamlOptions, markdown } =
            this.yaml.parseYamlFrontMatter(source);
        const separators = this.yaml.getSlideOptions(yamlOptions);
        const yamlLength = source.indexOf(markdown);
        const offset = source.substring(0, yamlLength).split(/^/gm).length;
        const slides = this.getSlideLines(markdown, separators);

        const cursorPosition = line - (offset > 0 ? offset - 1 : 0);

        let resultKey = null;
        for (const [key, value] of slides.entries()) {
            if (value <= cursorPosition) {
                resultKey = key;
            } else {
                break;
            }
        }
        if (resultKey) {
            const keys = resultKey.split(",");
            return [Number.parseInt(keys[0], 10), Number.parseInt(keys[1], 10)];
        }
        return [0, 0];
    }

    getTargetLine(url: URL, source: string): number {
        const pageString = url.href.substring(url.href.lastIndexOf("#"));
        const [, h, v] = this.urlRegex.exec(pageString);
        const { yamlOptions, markdown } =
            this.yaml.parseYamlFrontMatter(source);
        const separators = this.yaml.getSlideOptions(yamlOptions);
        const yamlLength = source.indexOf(markdown);
        const offset = source.substring(0, yamlLength).split(/^/gm).length;
        const slides = this.getSlideLines(markdown, separators);

        const hX = Number.parseInt(h, 10) || 0;
        const vX = Number.parseInt(v, 10) || 0;

        return slides.get([hX, vX].join(",")) + offset;
    }

    // ── Multi-file sync ────────────────────────────────────────────────────────

    private getMasterFile(): TFile | null {
        try {
            const url = new URL(this.url);
            const filename = decodeURI(url.pathname.split("/").at(-1) ?? "");
            if (!filename) return null;
            return this.app.vault.getFiles().find((f) => f.name === filename) ?? null;
        } catch {
            return null;
        }
    }

    private normalizeFilename(filename: string): string {
        const name = filename.replace(/\\/g, "/").split("/").at(-1) ?? filename;
        return name.endsWith(".md") ? name.slice(0, -3) : name;
    }

    private buildExpandedContent(
        masterMarkdown: string,
        masterBasename: string,
    ): {
        expandedMarkdown: string;
        lineMap: Array<{ filename: string; localLine: number }>;
        masterEmbedLines: Map<number, number>;
        chapterYamlOffsets: Map<string, number>;
    } {
        const embedRegex = /^!\[\[(.+?)(?:\|[^\]]+)?\]\]$/;
        const chapterYamlRegex = /^---\n[\s\S]*?\n---\n/;
        const lines = masterMarkdown.split("\n");
        const expandedLines: string[] = [];
        const lineMap: Array<{ filename: string; localLine: number }> = [];
        const masterEmbedLines = new Map<number, number>();
        const chapterYamlOffsets = new Map<string, number>();

        for (let i = 0; i < lines.length; i++) {
            const match = embedRegex.exec(lines[i]);
            if (match) {
                const chapterName = match[1];
                const content = this.plugin.obsidianUtils.parseFile(chapterName, null);
                if (content != null) {
                    // Compute YAML line offset for this chapter file
                    const relativePath = this.plugin.obsidianUtils.getRelativePath(chapterName);
                    if (relativePath) {
                        const raw = this.plugin.obsidianUtils.readFileRawByPath(relativePath);
                        if (raw) {
                            const yamlMatch = chapterYamlRegex.exec(raw);
                            if (yamlMatch) {
                                const yamlLineCount = (yamlMatch[0].match(/\n/g) || []).length;
                                chapterYamlOffsets.set(this.normalizeFilename(chapterName), yamlLineCount);
                            }
                        }
                    }

                    masterEmbedLines.set(i, expandedLines.length);
                    const chapterLines = content.split("\n");
                    for (let j = 0; j < chapterLines.length; j++) {
                        expandedLines.push(chapterLines[j]);
                        lineMap.push({ filename: chapterName, localLine: j });
                    }
                } else {
                    // Chapter not found; treat the embed line as master content
                    expandedLines.push(lines[i]);
                    lineMap.push({ filename: masterBasename, localLine: i });
                }
            } else {
                expandedLines.push(lines[i]);
                lineMap.push({ filename: masterBasename, localLine: i });
            }
        }

        return {
            expandedMarkdown: expandedLines.join("\n"),
            lineMap,
            masterEmbedLines,
            chapterYamlOffsets,
        };
    }

    private getExpandedCache(masterFile: TFile): typeof this.expandedCache {
        if (this.expandedCache?.masterPath === masterFile.path) {
            return this.expandedCache;
        }

        const raw = this.plugin.obsidianUtils.readFileRawByPath(masterFile.path);
        if (!raw) return null;

        const { yamlOptions, markdown: masterMarkdown } =
            this.yaml.parseYamlFrontMatter(raw);
        const separators = this.yaml.getSlideOptions(yamlOptions);

        const yamlLength = raw.indexOf(masterMarkdown);
        const yamlLineCount = raw.substring(0, yamlLength).split(/^/gm).length;
        const masterYamlLineOffset = yamlLineCount > 0 ? yamlLineCount - 1 : 0;

        const masterBasename = this.normalizeFilename(masterFile.name);
        const { expandedMarkdown, lineMap, masterEmbedLines, chapterYamlOffsets } =
            this.buildExpandedContent(masterMarkdown, masterBasename);

        this.expandedCache = {
            masterPath: masterFile.path,
            expandedMarkdown,
            lineMap,
            masterEmbedLines,
            separators,
            masterYamlLineOffset,
            chapterYamlOffsets,
        };
        return this.expandedCache;
    }

    private findInLineMap(
        targetBasename: string,
        localLine: number,
        lineMap: Array<{ filename: string; localLine: number }>,
    ): number {
        // Exact match
        for (let i = 0; i < lineMap.length; i++) {
            if (
                this.normalizeFilename(lineMap[i].filename) === targetBasename &&
                lineMap[i].localLine === localLine
            ) {
                return i;
            }
        }
        // Fallback: last position at or before cursor for this file
        let best = 0;
        for (let i = 0; i < lineMap.length; i++) {
            if (
                this.normalizeFilename(lineMap[i].filename) === targetBasename &&
                lineMap[i].localLine <= localLine
            ) {
                best = i;
            }
        }
        return best;
    }

    private getTargetSlideMultiFile(
        cursorLine: number,
        view: MarkdownView,
        masterFile: TFile,
    ): [number, number] {
        const cache = this.getExpandedCache(masterFile);
        if (!cache) {
            return this.getTargetSlide(cursorLine, view.data);
        }

        const { expandedMarkdown, lineMap, masterEmbedLines, separators, masterYamlLineOffset, chapterYamlOffsets } =
            cache;
        const masterBasename = this.normalizeFilename(masterFile.name);
        const activeBasename = this.normalizeFilename(view.file.name);

        let expandedCursorLine: number;

        if (activeBasename === masterBasename) {
            // Editing the master file: subtract YAML lines to get position within masterMarkdown
            const localLine = cursorLine - masterYamlLineOffset;
            if (masterEmbedLines.has(localLine)) {
                // Cursor is on an ![[embed]] line — jump to start of that chapter
                expandedCursorLine = masterEmbedLines.get(localLine)!;
            } else {
                expandedCursorLine = this.findInLineMap(masterBasename, localLine, lineMap);
            }
        } else {
            // Editing a chapter file: subtract chapter YAML offset so localLine matches lineMap
            const chapterYamlOffset = chapterYamlOffsets.get(activeBasename) ?? 0;
            const localLine = cursorLine - chapterYamlOffset;
            expandedCursorLine = this.findInLineMap(activeBasename, localLine, lineMap);
        }

        const slides = this.getSlideLines(expandedMarkdown, separators);
        let resultKey: string | null = null;
        for (const [key, value] of slides.entries()) {
            if (value <= expandedCursorLine) {
                resultKey = key;
            } else {
                break;
            }
        }
        if (resultKey) {
            const keys = resultKey.split(",");
            return [Number.parseInt(keys[0], 10), Number.parseInt(keys[1], 10)];
        }
        return [0, 0];
    }

    // ── Slide line mapping ─────────────────────────────────────────────────────

    getSlideLines(source: string, separators: Options) {
        let store = new Map<number, string>();

        const l = this.getIdxOfRegex(/^/gm, source);
        const h = this.getIdxOfRegex(
            RegExp(separators.separator, "gm"),
            source,
        );

        for (const item of h) {
            for (let index = 0; index < l.length; index++) {
                const line = l[index];
                if (line > item) {
                    store.set(index, "h");
                    break;
                }
            }
        }

        const v = this.getIdxOfRegex(
            RegExp(separators.verticalSeparator, "gm"),
            source,
        );

        for (const item of v) {
            for (let index = 0; index < l.length; index++) {
                const line = l[index];
                if (line > item) {
                    store.set(index, "v");
                    break;
                }
            }
        }

        store.set(0, "h");

        store = new Map(
            [...store].sort((a, b) => {
                return a[0] - b[0];
            }),
        );

        const result = new Map<string, number>();

        let hV = -1;
        let vV = 0;
        for (const [key, value] of store.entries()) {
            if (value === "h") {
                hV++;
                vV = 0;
            }

            if (value === "v") {
                vV++;
            }

            result.set([hV, vV].join(","), key);
        }
        return result;
    }

    getIdxOfRegex(regex: RegExp, source: string): number[] {
        const idxs: Array<number> = [] as number[];
        let m: RegExpExecArray | null;
        do {
            m = regex.exec(source);
            if (m) {
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                idxs.push(m.index);
            }
        } while (m);
        return idxs;
    }

    getViewType() {
        return REVEAL_PREVIEW_VIEW;
    }

    getDisplayText() {
        const name = this.plugin.getTargetName();
        return name ? `Preview: ${name}` : "Slide preview";
    }

    getIcon() {
        return "slides";
    }

    setUrl(url: string, rerender = true) {
        this.url = url;
        if (rerender) {
            this.renderView();
        }
    }

    onChange() {
        this.expandedCache = null;
        this.reloadIframe();
    }

    async onClose() {
        window.removeEventListener("message", this.onMessage);
        this.onCloseListener();
    }

    private reloadIframe() {
        const viewContent = this.containerEl.children[1];
        const iframe = viewContent.getElementsByTagName("iframe")[0];
        iframe.contentWindow.postMessage("reload", this.url);
    }

    private renderView() {
        const viewContent = this.containerEl.children[1];

        viewContent.empty();
        viewContent.addClass("reveal-preview-view");
        viewContent.createEl("iframe", {
            attr: {
                // @ts-expect-error:
                src: this.url,
                sandbox: "allow-scripts allow-same-origin allow-popups",
            },
        });
    }
}
