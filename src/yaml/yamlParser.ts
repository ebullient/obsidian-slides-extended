import { parseYaml } from "obsidian";

import type { Options, SlidesExtendedSettings } from "../@types";
import { DEFAULTS } from "../slidesExtended-constants";
import { isEmpty, isNil, omitBy, pick } from "../util";

/**
 * Reveal.js configuration properties that must be numeric.
 * YAML frontmatter may supply these as strings (e.g. `margin: "0"`);
 * passing a string causes reveal.js to misbehave silently.
 */
const NUMERIC_REVEAL_PROPS = new Set([
    "width",
    "height",
    "margin",
    "minScale",
    "maxScale",
    "autoAnimateDuration",
    "autoSlide",
    "defaultTiming",
    "viewDistance",
    "mobileViewDistance",
    "hideCursorTime",
    "pdfMaxPagesPerSlide",
    "pdfPageHeightOffset",
]);

/**
 * Coerce string values to numbers for reveal.js properties that expect
 * numeric types. If coercion produces NaN the original value is kept so
 * reveal.js can fall back to its own default.
 */
function coerceNumericRevealOptions(
    options: Record<string, unknown>,
): Record<string, unknown> {
    for (const key of NUMERIC_REVEAL_PROPS) {
        if (key in options && typeof options[key] === "string") {
            const n = Number(options[key]);
            if (!Number.isNaN(n)) {
                options[key] = n;
            }
        }
    }
    return options;
}

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
            "editMode",
        ];
        const globalSettings = pick(
            omitBy(this.settings, isEmpty),
            revealProps,
        );
        const slideSettings = pick(options, revealProps);
        const merged = Object.assign({}, globalSettings, slideSettings);
        return coerceNumericRevealOptions(merged);
    }

    getTemplateSettings(options: Partial<Options>) {
        const properties = [
            "enableOverview",
            "enableChalkboard",
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
