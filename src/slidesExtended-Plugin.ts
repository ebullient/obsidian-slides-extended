import { addIcon, Plugin, type TAbstractFile } from "obsidian";
import type { SlidesExtendedSettings } from "./@types";
import { RevealServer } from "./reveal/revealServer";
import { ObsidianUtils } from "./obsidian/obsidianUtils";
// import { AutoCompleteSuggest } from './obsidian/suggesters/AutoCompleteSuggester';
import {
    REVEAL_PREVIEW_VIEW,
    RevealPreviewView,
} from "./reveal/revealPreviewView";
import { LineSelectionListener } from "./obsidian/suggesters/lineSelectionListener";
import {
    DEFAULT_SETTINGS,
    ICON_DATA,
    REFRESH_ICON,
} from "./slidesExtended-constants";
import { SlidesExtendedSettingTab } from "./slidesExtended-SettingTab";
import { EmbeddedSlideProcessor } from "./obsidian/embeddedSlideProcessor";
import { SlidesExtendedDistribution } from "./slidesExtended-Distribution";

export class SlidesExtendedPlugin extends Plugin {
    settings: SlidesExtendedSettings;
    obsidianUtils: ObsidianUtils;

    private revealServer: RevealServer;
    // private autoCompleteSuggester: AutoCompleteSuggest;
    private target: TAbstractFile;
    private slideProcessor: EmbeddedSlideProcessor;
    private port: number;
    private serverUrl: URL;

    async onload() {
        await this.loadSettings();

        addIcon("slides", ICON_DATA);
        addIcon("refresh", REFRESH_ICON);

        const numPort = Number(this.settings.port);
        this.port = Number.isNaN(numPort) ? 3000 : numPort;
        this.serverUrl = new URL(`http://localhost:${this.port}`);

        this.obsidianUtils = new ObsidianUtils(this.app, this.settings);

        this.registerView(
            REVEAL_PREVIEW_VIEW,
            (leaf) =>
                new RevealPreviewView(
                    leaf,
                    this.url,
                    this.settings,
                    this.hideView.bind(this),
                ),
        );
        this.registerEvent(
            this.app.vault.on("modify", this.onChange.bind(this)),
        );
        this.registerEditorSuggest(new LineSelectionListener(this.app, this));

        this.addRibbonIcon("slides", "Show slide preview", async () => {
            await this.showView();
        });

        this.addCommand({
            id: "open-preview",
            name: "Show slide preview",
            callback: async () => this.toggleView(),
        });
        this.addCommand({
            id: "reload-preview",
            name: "Reload slide preview",
            callback: () => {
                const instance = this.getViewInstance();
                if (!instance) {
                    return;
                }
                instance.onChange();
            },
        });
        this.addCommand({
            id: "stop-server-preview",
            name: "Stop slide preview server",
            callback: async () => this.revealServer.stop(),
        });
        this.addCommand({
            id: "start-server-preview",
            name: "Start slide preview server",
            callback: async () => this.revealServer.start(),
        });

        this.addSettingTab(new SlidesExtendedSettingTab(this.app, this));
        this.app.workspace.onLayoutReady(this.layoutReady);

        this.slideProcessor = new EmbeddedSlideProcessor(this);
        this.registerMarkdownCodeBlockProcessor(
            "slide",
            this.slideProcessor.handler,
        );
        this.registerMarkdownPostProcessor(
            this.obsidianUtils.markdownProcessor.postProcess,
        );
    }

    get url(): URL {
        return this.serverUrl;
    }

    layoutReady = async () => {
        try {
            const version = this.manifest.version;
            const distribution = new SlidesExtendedDistribution(this);

            console.log(
                "Slides Extended v%s, needsReload=%s",
                version,
                distribution.isOutdated(),
            );
            if (distribution.isOutdated()) {
                await distribution.update();
                console.log("Slides Extended updated to v%s", version);
            }

            this.configureServer();
            await this.initServer();
        } catch (err) {
            console.debug("Slides Extended caught an error", err);
        }

        // this.autoCompleteSuggester = new AutoCompleteSuggest(this.app);

        // if (this.settings.autoComplete == 'always') {
        //     this.autoCompleteSuggester.activate();
        // } else {
        //     this.autoCompleteSuggester.deactivate();
        // }
        // this.registerEditorSuggest(this.autoCompleteSuggester);
    };

    getViewInstance(): RevealPreviewView {
        for (const leaf of this.app.workspace.getLeavesOfType(
            REVEAL_PREVIEW_VIEW,
        )) {
            const view = leaf.view;
            if (view instanceof RevealPreviewView) {
                return view;
            }
        }
        return null;
    }

    onChange(file: TAbstractFile) {
        if (!this.settings.autoReload) {
            return;
        }
        const instance = this.getViewInstance();
        if (!instance) {
            return;
        }
        if (file === this.target) {
            instance.onChange();
        }
    }

    async toggleView() {
        const instance = this.getViewInstance();
        if (instance) {
            this.app.workspace.detachLeavesOfType(REVEAL_PREVIEW_VIEW);
            // if (this.settings.autoComplete == 'inPreview') {
            //     this.autoCompleteSuggester.deactivate();
            // }
        } else {
            // if (this.settings.autoComplete != 'never') {
            //     this.autoCompleteSuggester.activate();
            // }
            await this.showView();
        }
    }

    hideView() {
        // if (this.settings.autoComplete == 'inPreview') {
        //     this.autoCompleteSuggester.deactivate();
        // }
    }

    async showView() {
        const targetDocument = this.app.workspace.getActiveFile();
        if (!targetDocument) {
            return;
        }
        if (
            targetDocument === this.target &&
            this.app.workspace.getLeavesOfType(REVEAL_PREVIEW_VIEW).length > 0
        ) {
            return;
        }
        this.target = targetDocument;
        await this.activateView();

        const url = this.revealServer.getTargetUrl(this.target);
        await this.openUrl(url);
    }

    configureServer = () => {
        this.revealServer = new RevealServer(
            this.obsidianUtils,
            this.port,
            this.url,
        );
    };

    initServer = async () => {
        if (this.settings.autoStart) {
            await this.revealServer.start();
        }

        const instance = this.getViewInstance();
        if (instance) {
            if (instance.url === "about:blank") {
                await this.showView();
            }
        }
    };

    stopServer = async () => {
        if (this.revealServer) {
            await this.revealServer.stop();
        }
        const instance = this.getViewInstance();
        if (instance) {
            await instance.onClose();
        }
    };

    private async openUrl(url: URL) {
        const instance = this.getViewInstance();
        instance.setUrl(url.toString());
    }

    async activateView() {
        this.app.workspace.detachLeavesOfType(REVEAL_PREVIEW_VIEW);
        if (this.settings.paneMode === "sidebar") {
            await this.app.workspace.getRightLeaf(true).setViewState({
                type: REVEAL_PREVIEW_VIEW,
                active: true,
            });
        } else {
            await this.app.workspace
                .getLeaf(this.settings.paneMode)
                .setViewState({
                    type: REVEAL_PREVIEW_VIEW,
                    active: false,
                });
        }
        this.app.workspace.revealLeaf(
            this.app.workspace.getLeavesOfType(REVEAL_PREVIEW_VIEW)[0],
        );
    }

    async onunload() {
        console.debug("unloading Slides Extended");
        await this.stopServer();
    }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData(),
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
        console.debug("Slides Extended: settings saved");

        await this.stopServer();
        this.obsidianUtils = new ObsidianUtils(this.app, this.settings);
        this.configureServer();
        await this.initServer();
        const instance = this.getViewInstance();
        if (instance) {
            await instance.onChange();
        }
    }

    async update(newSettings: SlidesExtendedSettings) {
        this.settings = newSettings;
        await this.saveSettings();
    }
}
