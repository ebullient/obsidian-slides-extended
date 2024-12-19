import path, { basename, extname, join } from "node:path";

import { exists, readFile } from "fs-extra";
import { glob } from "glob";
import Mustache from "mustache";
import type { QueryString } from "../@types";
import type { MarkdownProcessor } from "../obsidian/markdownProcessor";
import {
    type ObsidianUtils,
    getMediaCollector,
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

        const content = (await readFile(filePath.toString())).toString();
        let rendered = await this.render(
            content,
            renderForPrint,
            renderForEmbed,
        );

        if (renderForExport) {
            this.utils.disableImageCollection();
            await this.exporter.export(
                filePath,
                rendered,
                getMediaCollector().getAll(),
            );
            rendered = await this.render(
                content,
                renderForPrint,
                renderForEmbed,
            );
        }

        return rendered;
    }

    async render(
        input: string,
        renderForPrint: boolean,
        renderEmbedded: boolean,
    ) {
        const { yamlOptions, markdown } = this.yaml.parseYamlFrontMatter(input);
        const options = this.yaml.getSlideOptions(yamlOptions, renderForPrint);
        const revealOptions = this.yaml.getRevealOptions(options);

        const { title } = options;
        const themeUrl = this.getThemeUrl(options.theme);
        const highlightThemeUrl = this.getHighlightThemeUrl(
            options.highlightTheme,
        );

        const slidifyOptions = this.yaml.getSlidifyOptions(options);

        const processedMarkdown = this.processor.process(markdown, options);
        const slides = this.slidify(processedMarkdown, slidifyOptions);

        const cssPaths = this.getCssPaths(options.css);
        const remoteCSSPaths = this.getCssPaths(options.remoteCSS);

        const settings = this.yaml.getTemplateSettings(options);

        const {
            enableChalkboard,
            enableCustomControls,
            enableOverview,
            enableMenu,
            enableTimeBar,
            enablePointer,
        } = settings;

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
            base,
            enableCustomControls,
            enableChalkboard,
            enableOverview,
            enableMenu,
            enablePointer,
            enableTimeBar,
            revealOptionsStr: JSON.stringify(revealOptions),
        });

        const template = await this.getPageTemplate(renderEmbedded);
        return Mustache.render(template, context);
    }

    private isValidUrl(input: string): boolean {
        try {
            new URL(input);
            return true;
        } catch (_) {
            return false;
        }
    }

    private getHighlightThemeUrl(theme: string) {
        return this.getThemeUrl(theme, this.utils.getHighlightSearchPath());
    }

    private getThemeUrl(
        theme: string,
        searchPath = this.utils.getThemeSearchPath(),
    ) {
        if (this.isValidUrl(theme)) {
            return theme;
        }

        for (const themeDir of searchPath) {
            const revealThemes = glob.sync("*.css", {
                cwd: themeDir,
            });

            // We're doing some compensation + matching here
            const key = basename(theme).replace(extname(theme), "");
            const revealTheme = revealThemes.find(
                (themePath) =>
                    basename(themePath).replace(extname(themePath), "") === key,
            );

            if (revealTheme) {
                return this.toExternalPath(path.join(themeDir, revealTheme));
            }
        }
        return theme;
    }

    private toExternalPath(urlPath: string): string {
        return urlPath
            .replace(this.utils.pluginDirectory, "")
            .replace(this.utils.vaultDirectory, "");
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

    private slidify(markdown: string, slidifyOptions: unknown) {
        return md.slidify(markdown, slidifyOptions);
    }

    private getCssPaths(css: string | string[], remote = false) {
        let input: string[] = [];
        if (!css) {
            return input;
        }
        if (typeof css === "string") {
            input = css.split(",");
        } else {
            input = css;
        }

        return input.map((css) => {
            if (this.isValidUrl(css)) {
                return css;
            }
            return this.getThemeUrl(css, this.utils.getLocalCssSearchPath());
        });
    }
}
