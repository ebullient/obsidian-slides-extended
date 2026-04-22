import path, { basename, extname, join } from "node:path";

import { exists, existsSync, readFile } from "fs-extra";
import { glob } from "glob";
import Mustache from "mustache";
import type { Options, QueryString } from "../@types";
import type { MarkdownProcessor } from "../obsidian/markdownProcessor";
import {
    getMediaCollector,
    type ObsidianUtils,
} from "../obsidian/obsidianUtils";
import { DEFAULTS } from "../slidesExtended-constants";
import { has, isEmpty } from "../util";
import { YamlParser } from "../yaml/yamlParser";
import { md } from "./markdown";
import { RevealExporter } from "./revealExporter";

export class RevealRenderer {
    private processor: MarkdownProcessor;
    private yaml: YamlParser;
    private exporter: RevealExporter;
    private utils: ObsidianUtils;

    constructor(utils: ObsidianUtils) {
        this.processor = utils.markdownProcessor;
        this.yaml = new YamlParser(utils.getSettings());
        this.exporter = new RevealExporter(utils);
        this.utils = utils;
    }

    async renderFile(filePath: string, params: QueryString) {
        let renderForExport = false;
        let renderForPrint = false;
        let renderForEmbed = false;

        if (!isEmpty(params)) {
            if (has(params, "export")) {
                renderForExport = params?.export;
            }

            if (has(params, "print-pdf")) {
                renderForPrint = true;
            }

            if (has(params, "embed")) {
                renderForEmbed = params?.embed;
            }
        }

        if (renderForExport) {
            this.utils.resetImageCollection();
        }

        const content = (await readFile(filePath.toString())).toString().trim();
        let { html, localAssetPaths } = await this.render(
            content,
            renderForPrint,
            renderForEmbed,
        );

        if (renderForExport) {
            this.utils.disableImageCollection();
            await this.exporter.export(
                filePath,
                html,
                getMediaCollector().getAll(),
                localAssetPaths,
            );
            ({ html } = await this.render(
                content,
                renderForPrint,
                renderForEmbed,
            ));
        }

        return html;
    }

    async render(
        input: string,
        renderForPrint: boolean,
        renderEmbedded: boolean,
    ): Promise<{ html: string; localAssetPaths: string[] }> {
        const { yamlOptions, markdown } = this.yaml.parseYamlFrontMatter(input);
        const options = this.yaml.getSlideOptions(yamlOptions, renderForPrint);
        const revealOptions = this.yaml.getRevealOptions(options);

        const { title } = options;
        const themeUrl = this.findAsset(
            options.theme,
            this.utils.getThemeSearchPath(),
        );
        const highlightThemeUrl = this.findAsset(
            options.highlightTheme,
            this.utils.getHighlightSearchPath(),
        );

        const slidifyOptions = this.yaml.getSlidifyOptions(options);

        const prefetched = await this.utils.fetchRemoteMarkdown(markdown);
        const processedMarkdown = this.processor.process(prefetched, options);
        const rawSlides = this.slidify(processedMarkdown, slidifyOptions);
        // Stamp separator attributes on every <section data-markdown> element so that
        // browser-side reveal.js re-processes each pre-split slide with the same
        // separators, preventing the default '\r?\n---\r?\n' from splitting slide
        // content that contains '---' as a horizontal rule or thematic break.
        const separatorAttrs = this.buildSeparatorAttributes(slidifyOptions);
        const slides = separatorAttrs
            ? rawSlides.replace(
                  /<section data-markdown>/g,
                  `<section ${separatorAttrs} data-markdown>`,
              )
            : rawSlides;

        const cssPaths = this.getAssetPaths(
            options.css,
            this.utils.getLocalCssSearchPath(),
        );
        const remoteCSSPaths = this.getAssetPaths(
            options.remoteCSS,
            this.utils.getLocalCssSearchPath(),
        );
        const scriptPaths = this.getAssetPaths(
            options.scripts,
            this.utils.getScriptSearchPath(),
        );
        const remoteScriptPaths = this.getAssetPaths(
            options.remoteScripts,
            this.utils.getScriptSearchPath(),
        );

        const settings = this.yaml.getTemplateSettings(options);

        const {
            enableChalkboard,
            enableAudioSlideshow,
            enableCustomControls,
            enableOverview,
            enableMenu,
            enableTimeBar,
            enablePointer,
            mathEngine,
        } = settings;

        const isKaTeX = mathEngine === "katex";
        const isMathJax = mathEngine === "mathjax";

        let base = "";
        if (!getMediaCollector().shouldCollect()) {
            base = "/";
        }

        const context = Object.assign(options, {
            title,
            slides,
            themeUrl,
            highlightThemeUrl,
            cssPaths,
            remoteCSSPaths,
            scriptPaths,
            remoteScriptPaths,
            base,
            enableCustomControls,
            enableChalkboard,
            enableAudioSlideshow,
            enableOverview,
            enableMenu,
            enablePointer,
            enableTimeBar,
            isKaTeX,
            isMathJax,
            revealOptionsStr: JSON.stringify(revealOptions),
        });

        const localAssetPaths = [
            ...(themeUrl && !this.isValidUrl(themeUrl) ? [themeUrl] : []),
            ...(highlightThemeUrl && !this.isValidUrl(highlightThemeUrl)
                ? [highlightThemeUrl]
                : []),
            ...cssPaths.filter((p: string) => !this.isValidUrl(p)),
            ...scriptPaths.filter((p: string) => !this.isValidUrl(p)),
        ];

        const template = await this.getPageTemplate(renderEmbedded);
        const html = Mustache.render(template, context);
        return { html, localAssetPaths };
    }

    private isValidUrl(input: string): boolean {
        try {
            new URL(input);
            return true;
        } catch (_) {
            return false;
        }
    }

    private findAsset(name: string, searchPath: string[]) {
        if (this.isValidUrl(name)) {
            return name;
        }

        for (const dir of searchPath) {
            // Direct path match (handles subdirectories like css/custom.css)
            const directPath = path.join(dir, name);
            if (existsSync(directPath)) {
                return this.toExternalPath(directPath);
            }

            // Basename glob match (existing behavior for short names like "black")
            const files = glob.sync("*.css", { cwd: dir });
            const key = basename(name).replace(extname(name), "");
            const match = files.find(
                (f) => basename(f).replace(extname(f), "") === key,
            );
            if (match) {
                return this.toExternalPath(path.join(dir, match));
            }
        }
        return name;
    }

    private toExternalPath(urlPath: string): string {
        // Normalize path separators to forward slashes before stripping base
        // directories. On Windows, path.join() normalises all separators to '\',
        // but vaultDirectory is constructed as `${getBasePath()}/` (trailing
        // forward slash). The mismatch means the string-replace never matches on
        // Windows and the full absolute path leaks into the <link> href → 404.
        // Normalising both sides to '/' is a no-op on macOS/Linux (path.sep is
        // already '/') so this does not change behaviour on non-Windows platforms.
        const normalized = urlPath.split(path.sep).join("/");
        return normalized
            .replace(this.utils.pluginDirectory.split(path.sep).join("/"), "")
            .replace(this.utils.vaultDirectory.split(path.sep).join("/"), "");
    }

    private async getPageTemplate(embed = false) {
        const relativePath = embed ? "embed.html" : DEFAULTS.template;

        const searchPath = this.utils.getHtmlTemplateSearchPath();
        for (const dir of searchPath) {
            const templateFile = join(dir, relativePath);
            if (await exists(templateFile)) {
                return (await readFile(templateFile.toString())).toString();
            }
        }

        console.error(
            `Template file ${relativePath} not found in search path: ${searchPath}.`,
        );
        return "";
    }

    private buildSeparatorAttributes(slidifyOptions: Partial<Options>): string {
        const attrs: string[] = [];
        if (slidifyOptions.separator) {
            attrs.push(
                `data-separator="${slidifyOptions.separator.replace(/"/g, "&quot;")}"`,
            );
        }
        if (slidifyOptions.verticalSeparator) {
            attrs.push(
                `data-separator-vertical="${slidifyOptions.verticalSeparator.replace(/"/g, "&quot;")}"`,
            );
        }
        if (slidifyOptions.notesSeparator) {
            attrs.push(
                `data-separator-notes="${slidifyOptions.notesSeparator.replace(/"/g, "&quot;")}"`,
            );
        }
        return attrs.join(" ");
    }

    private slidify(markdown: string, slidifyOptions: unknown) {
        return md.slidify(markdown, slidifyOptions);
    }

    private getAssetPaths(assets: string | string[], searchPath: string[]) {
        let input: string[] = [];
        if (!assets) {
            return input;
        }
        if (typeof assets === "string") {
            input = assets.split(",");
        } else {
            input = assets;
        }

        return input.map((asset) => {
            if (this.isValidUrl(asset)) {
                return asset;
            }
            return this.findAsset(asset, searchPath);
        });
    }
}
