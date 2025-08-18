import {
    ItemView,
    MarkdownView,
    type Menu,
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
            window.open(home);
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
                .onClick(() => {
                    window.open(`${this.home.toString()}?print-pdf`);
                });
        });
        menu.addItem((item) => {
            item.setIcon("install")
                .setTitle("Export as html")
                .onClick(() => {
                    const url = new URL(this.url);
                    url.searchParams.append("export", "true");
                    this.setUrl(url.toString());
                });
        });
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
