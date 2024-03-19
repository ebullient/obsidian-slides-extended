import { PaneType } from 'obsidian';

export interface EmbeddedSlideParameters {
    slide: string;
    page?: number;
}

interface QueryString {
    embed: boolean;
    export: boolean;
}
export interface AdvancedSlidesSettings {
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
    paneMode: 'split' | 'tab' | 'sidebar';
    themeDirectory: string;
    center: boolean;
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
};

export interface ImageCollector {
    shouldCollect(): boolean;

    addImage(value: string): void;

    getAll(): string[];
}
