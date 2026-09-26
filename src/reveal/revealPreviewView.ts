import {
    ItemView,
    MarkdownView,
    type Menu,
    type WorkspaceLeaf,
} from "obsidian";
import type { Options, SlidesExtendedSettings } from "../@types";
import type { SlidesExtendedPlugin } from "../slidesExtended-Plugin";
import { YamlParser } from "../yaml/yamlParser";

export const REVEAL_PREVIEW_VIEW = "reveal-preview-view";

// Change to 1 to emit one-decimal precision once upstream accepts decimals.
const GRID_COORDINATE_PRECISION = 0;

export class RevealPreviewView extends ItemView {
    url = "about:blank";
    private home: URL;
    private onCloseListener: () => void;
    private boundOnMessage = (ev: MessageEvent) => this.onMessage(ev);

    private urlRegex = /#\/(\d*)(?:\/(\d*))?(?:\/(\d*))?/;
    private yaml: YamlParser;
    private plugin: SlidesExtendedPlugin;
    private editAction: HTMLElement;
    private gridAction: HTMLElement;

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

        if (settings.paneMode !== "tab") {
            this.addAction("link", "Rebind view to current note", () => {
                void this.plugin.showView();
            });
        }

        if (settings.paneMode === "sidebar") {
            this.addAction("monitor-x", "Close preview", () => {
                this.leaf.detach();
            });
        }

        this.addAction("globe", "Open in browser", () => {
            this.openInBrowser();
        });

        this.gridAction = this.addAction("grid", "Show grid", () => {
            settings.showGrid = !settings.showGrid;
            this.updateGridIcon();
            this.reloadIframe();
        });
        this.updateGridIcon();

        this.editAction = this.addAction(
            "square-dashed-mouse-pointer",
            "Toggle edit mode",
            () => void this.toggleEditMode(),
        );
        this.updateEditModeIcon();

        this.addAction("refresh", "Refresh slides", () => {
            this.reloadIframe();
        });

        window.addEventListener("message", this.boundOnMessage);
    }

    onPaneMenu(menu: Menu, source: string): void {
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
                .setTitle("Export as HTML")
                .onClick(() => this.exportAsHtml());
        });
    }

    openInBrowser() {
        window.open(this.home);
    }

    async toggleEditMode() {
        this.plugin.settings.editMode = !this.plugin.settings.editMode;
        await this.plugin.saveSettings();
        this.updateEditModeIcon();
    }

    updateEditModeIcon() {
        this.editAction.toggleClass("is-active", this.plugin.settings.editMode);
        this.editAction.setAttribute(
            "aria-pressed",
            this.plugin.settings.editMode ? "true" : "false",
        );
        this.editAction.setAttribute(
            "title",
            this.plugin.settings.editMode
                ? "Disable edit mode"
                : "Enable edit mode",
        );
    }

    updateGridIcon() {
        this.gridAction.toggleClass("is-active", this.plugin.settings.showGrid);
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
        if (this.isGridDrawMessage(msg.data)) {
            this.insertGridAtCursor(msg.data);
            return;
        }

        if (this.isFocusFrameMessage(msg.data)) {
            this.focusIframe();
            return;
        }

        const data = String(msg.data);
        if (data.includes("?export")) {
            this.setUrl(data.split("?")[0]);
            return;
        }

        this.setUrl(data, false);

        const url = new URL(data);
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

    isGridDrawMessage(data: unknown): boolean {
        return (
            typeof data === "object" &&
            data !== null &&
            (data as { type?: string }).type === "slides-extended-grid-draw"
        );
    }

    isFocusFrameMessage(data: unknown): boolean {
        return (
            typeof data === "object" &&
            data !== null &&
            (data as { type?: string }).type === "slides-extended-focus-frame"
        );
    }

    focusIframe() {
        const viewContent = this.containerEl.children[1];
        const iframe = viewContent.getElementsByTagName("iframe")[0];
        if (iframe) {
            iframe.focus();
        }
    }

    insertGridAtCursor(data: {
        left: number;
        top: number;
        width: number;
        height: number;
        slidesGrid?: string | number | null;
        slide?: string | null;
    }) {
        const view = this.getSourceMarkdownView();
        if (!view) {
            return;
        }

        const grid = `<grid drag="${data.width.toFixed(GRID_COORDINATE_PRECISION)} ${data.height.toFixed(GRID_COORDINATE_PRECISION)}" drop="${data.left.toFixed(GRID_COORDINATE_PRECISION)} ${data.top.toFixed(GRID_COORDINATE_PRECISION)}">\n\n</grid>\n`;

        // Defer to a task after the current focus/blur settle, so the
        // markdown editor is focused only at the moment of insertion and
        // does not steal focus during edit-mode navigation.
        window.setTimeout(() => {
            view.editor.focus();
            const start = view.editor.getCursor();
            view.editor.replaceSelection(`${grid}\n`);
            view.editor.setCursor({ line: start.line + 1, ch: 0 });
        }, 0);
    }

    getSourceMarkdownView(): MarkdownView | null {
        const target = this.plugin.getTargetFile();
        if (!target) {
            return null;
        }

        for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
            const view = leaf.view as MarkdownView | undefined;
            if (view?.file && view.file.path === target.path) {
                return view;
            }
        }

        return this.app.workspace.getActiveViewOfType(MarkdownView) ?? null;
    }

    onLineChanged(line: number) {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        const viewContent = this.containerEl.children[1];
        const iframe = viewContent.getElementsByTagName("iframe")[0];

        if (view && iframe) {
            const [x, y] = this.getTargetSlide(line, view.data);
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
        this.reloadIframe();
    }

    async onClose() {
        window.removeEventListener("message", this.boundOnMessage);
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
