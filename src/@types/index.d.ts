export interface EmbeddedSlideParameters {
    slide: string;
    page?: number;
}

export interface QueryString {
    embed: boolean;
    export: boolean;
}

export interface SlidesExtendedSettings {
    port: string;
    host: string;
    autoReload: boolean;
    autoStart: boolean;
    exportDirectory: string;
    enableOverview: boolean;
    enableChalkboard: boolean;
    chalkboardPenWidth: number;
    chalkboardChalkWidth: number;
    enableMenu: boolean;
    enablePointer: boolean;
    enableTimeBar: boolean;
    theme: string;
    highlightTheme: string;
    transition: string;
    transitionSpeed: string;
    controls: boolean;
    progress: boolean;
    slideNumber: boolean;
    showGrid: boolean;
    autoComplete: string;
    paneMode: "split" | "tab" | "sidebar";
    assetsDirectory: string;
    center: boolean;
    mathEngine: "katex" | "mathjax";
    scripts: string;
    remoteScripts: string;
    separator: string;
    verticalSeparator: string;
}

export type ChartJsOptions = {
    elements?: unknown;
    plugins?: unknown;
    scales?: unknown;
};

export interface Processor {
    process: (markdown: string, options?: Options) => string;
}

export type Options = {
    bg: string;
    center: boolean;
    css: string | string[];
    defaultTemplate: string;
    enableLinks: boolean;
    height: number;
    highlightTheme: string;
    log: boolean;
    margin: number;
    notesSeparator: string;
    remoteCSS: string | string[];
    scripts: string | string[];
    remoteScripts: string | string[];
    separator: string;
    showGrid: boolean;
    template: string;
    theme: string;
    timeForPresentation: number;
    title: string;
    verticalSeparator: string;
    width: number;
    enableCustomControls: boolean;
    transition: string;
    mathEngine: "katex" | "mathjax";
    chalkboard?: {
        penWidth?: number;
        chalkWidth?: number;
        [key: string]: unknown;
    };
    chalkboardPenWidth?: number;
    chalkboardChalkWidth?: number;
    [key: string]: unknown;
};

export interface MediaCollector {
    shouldCollect(): boolean;

    addMedia(value: string): void;

    getAll(): string[];
}

export type Alignment = string | undefined;
