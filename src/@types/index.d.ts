export interface EmbeddedSlideParameters {
    slide: string;
    page?: number;
}

interface QueryString {
    embed: boolean;
    export: boolean;
}
export interface SlidesExtendedSettings {
    port: string;
    autoReload: boolean;
    autoStart: boolean;
    exportDirectory: string;
    enableOverview: boolean;
    enableChalkboard: boolean;
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
    themeDirectory: string;
    center: boolean;
}

export type ChartJsOptions = {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    elements?: any;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    plugins?: any;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    scales?: any;
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
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    [key: string]: any;
};

export interface MediaCollector {
    shouldCollect(): boolean;

    addMedia(value: string): void;

    getAll(): string[];
}
