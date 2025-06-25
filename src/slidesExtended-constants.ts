import type { MediaCollector, Options, SlidesExtendedSettings } from "./@types";

export const ICON_DATA =
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><path fill="currentColor" stroke="currentColor" d="M100 74.242V1.516H0v72.726h45.453v15.153H31.816v9.09h36.368v-9.09H54.547V74.242Zm-90.91-9.09V10.605h81.82v54.547Zm0 0"/><path fill="currentColor" stroke="currentColor" d="M54.547 19.695h9.09V56.06h-9.09ZM72.727 25.758h9.09v30.305h-9.09ZM36.363 31.816h9.09V56.06h-9.09ZM18.184 22.727h9.09v33.335h-9.09Zm0 0"/></svg>';

export const REFRESH_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><path fill="currentColor" stroke="currentColor" d="M70.691 87.988a38.342 38.342 0 0 1-3.414 1.125 1.885 1.885 0 1 0 1.012 3.633 41.67 41.67 0 0 0 3.75-1.234 1.886 1.886 0 1 0-1.348-3.524ZM80.14 82.82a41.04 41.04 0 0 1-2.984 2.008c-.89.54-1.176 1.7-.633 2.59a1.88 1.88 0 0 0 2.59.633 43.628 43.628 0 0 0 3.278-2.203 1.891 1.891 0 0 0 .39-2.637 1.884 1.884 0 0 0-2.64-.39ZM60.2 90.402c-1.184.11-2.395.164-3.595.164a1.883 1.883 0 0 0-1.886 1.887c0 1.043.84 1.887 1.886 1.887 1.313 0 2.637-.059 3.934-.176a1.89 1.89 0 0 0 1.711-2.05c-.094-1.04-1.027-1.821-2.05-1.712ZM95.73 64.96a1.884 1.884 0 0 0-2.46 1.032 38.605 38.605 0 0 1-1.52 3.262 1.893 1.893 0 0 0 .8 2.547c.278.144.579.21.872.21.68 0 1.34-.366 1.676-1.011a43.077 43.077 0 0 0 1.664-3.574 1.892 1.892 0 0 0-1.032-2.465ZM98.055 53.91c-1.016-.133-1.973.621-2.094 1.653a39.641 39.641 0 0 1-.578 3.554 1.886 1.886 0 1 0 3.691.774c.27-1.278.48-2.582.637-3.891a1.887 1.887 0 0 0-1.656-2.09ZM87.86 75.3a41.33 41.33 0 0 1-2.344 2.735 1.889 1.889 0 0 0 2.754 2.582 40.924 40.924 0 0 0 2.562-2.996 1.88 1.88 0 0 0-.328-2.644 1.88 1.88 0 0 0-2.645.324ZM98.113 50.945a1.886 1.886 0 0 0 1.887-1.89C100 25.125 80.535 5.66 56.605 5.66c-22.468 0-40.996 17.16-43.18 39.059L3.224 34.516a1.884 1.884 0 0 0-2.668 0 1.884 1.884 0 0 0 0 2.668L13.758 50.39c.176.172.383.312.617.406a1.836 1.836 0 0 0 1.441 0c.23-.094.442-.234.614-.406l13.207-13.207a1.884 1.884 0 0 0 0-2.668 1.884 1.884 0 0 0-2.668 0l-9.653 9.652c2.418-19.547 19.098-34.734 39.29-34.734 21.843 0 39.62 17.777 39.62 39.62 0 1.048.844 1.891 1.887 1.891Zm0 0"/></svg>';

export const DEFAULT_SETTINGS: SlidesExtendedSettings = {
    port: "3000",
    autoReload: true,
    autoStart: true,
    exportDirectory: "/export",
    enableChalkboard: false,
    enableOverview: false,
    enableMenu: false,
    enablePointer: false,
    enableTimeBar: false,
    theme: "black",
    highlightTheme: "zenburn",
    transition: "slide",
    transitionSpeed: "default",
    controls: true,
    progress: true,
    slideNumber: false,
    showGrid: false,
    autoComplete: "inPreview",
    paneMode: "split",
    themeDirectory: "",
    center: true,
};
export const DEFAULTS: Options = {
    bg: "",
    center: true,
    css: "",
    defaultTemplate: "",
    enableCustomControls: true,
    enableLinks: false,
    height: 700,
    highlightTheme: "zenburn",
    log: false,
    margin: 0.04,
    notesSeparator: "note:",
    remoteCSS: "",
    separator: "\r?\n---\r?\n",
    showGrid: false,
    template: "reveal.html",
    theme: "black",
    timeForPresentation: 120,
    title: "",
    transition: "slide",
    verticalSeparator: "\r?\n--\r?\n",
    width: 960,
};

export const DISABLED_IMAGE_COLLECTOR: MediaCollector = {
    addMedia(_value: string): void {},
    getAll(): string[] {
        return [];
    },
    shouldCollect(): boolean {
        return false;
    },
};
