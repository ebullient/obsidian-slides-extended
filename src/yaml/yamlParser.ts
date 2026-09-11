import { parseYaml } from "obsidian";

import type { Options, SlidesExtendedSettings } from "../@types";
import { DEFAULTS } from "../slidesExtended-constants";
import { isEmpty, isNil, omitBy, pick } from "../util";

export class YamlParser {
    private settings: SlidesExtendedSettings;

    constructor(settings: SlidesExtendedSettings) {
        this.settings = settings;
    }

    getSlideOptions(options: unknown, print = false): Options {
        const globalSettings = omitBy(
            this.settings,
            (v) => isNil(v) || v === "",
        );
        const printOptions = print ? this.getPrintOptions() : {};
        return Object.assign(
            {},
            DEFAULTS,
            globalSettings,
            options,
            printOptions,
        ) as Options;
    }

    private getPrintOptions() {
        return {
            enableOverview: false,
            enableChalkboard: false,
            enableMenu: false,
            enablePointer: false,
            enableCustomControls: false,
            enableTimeBar: false,
            controls: false,
        };
    }

    getSlidifyOptions(options: Partial<Options>) {
        const slidifyProps = [
            "separator",
            "verticalSeparator",
            "notesSeparator",
        ];
        return pick(options, slidifyProps);
    }

    getRevealOptions(options: Partial<Options>) {
        const revealProps = [
            "width",
            "height",
            "margin",
            "minScale",
            "maxScale",
            "controls",
            "controlsTutorial",
            "controlsLayout",
            "controlsBackArrows",
            "progress",
            "slideNumber",
            "showSlideNumber",
            "hashOneBasedIndex",
            "hash",
            "respondToHashChanges",
            "history",
            "keyboard",
            "keyboardCondition",
            "disableLayout",
            "overview",
            "center",
            "touch",
            "loop",
            "rtl",
            "navigationMode",
            "shuffle",
            "fragments",
            "fragmentInURL",
            "embedded",
            "help",
            "pause",
            "showNotes",
            "autoPlayMedia",
            "preloadIframes",
            "autoAnimate",
            "autoAnimateMatcher",
            "autoAnimateEasing",
            "autoAnimateDuration",
            "autoAnimateUnmatched",
            "autoSlide",
            "autoSlideStoppable",
            "autoSlideMethod",
            "defaultTiming",
            "mouseWheel",
            "previewLinks",
            "postMessage",
            "postMessageEvents",
            "focusBodyOnPageVisibilityChange",
            "transition",
            "transitionSpeed",
            "backgroundTransition",
            "pdfMaxPagesPerSlide",
            "pdfSeparateFragments",
            "pdfPageHeightOffset",
            "viewDistance",
            "mobileViewDistance",
            "display",
            "hideInactiveCursor",
            "hideCursorTime",
            "markdown",
            "mermaid",
        ];
        const globalSettings = pick(
            omitBy(this.settings, isEmpty),
            revealProps,
        );
        const slideSettings = pick(options, revealProps);
        return Object.assign({}, globalSettings, slideSettings);
    }

    getTemplateSettings(options: Partial<Options>) {
        const properties = [
            "enableOverview",
            "enableChalkboard",
            "chalkboardPenWidth",
            "chalkboardChalkWidth",
            "enableAudioSlideshow",
            "enableMenu",
            "enableCustomControls",
            "enableTimeBar",
            "enablePointer",
            "mathEngine",
        ];

        const globalSettings = pick(this.settings, properties);
        const slideSettings = pick(options, properties);

        return Object.assign({}, globalSettings, slideSettings);
    }

    parseYamlFrontMatter(input: string): {
        yamlOptions: unknown;
        markdown: string;
    } {
        const stripped = input.replace(/^\uFEFF/, "");
        const match = /^---\r?\n([\w\W]+?)\r?\n---\r?\n?([\w\W]*)/.exec(
            stripped,
        );
        if (!match) {
            return { yamlOptions: {}, markdown: stripped };
        }
        try {
            return {
                yamlOptions: parseYaml(match[1]) ?? {},
                markdown: match[2] || stripped,
            };
        } catch {
            return { yamlOptions: {}, markdown: stripped };
        }
    }
}
