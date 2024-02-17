import { addIcon, Plugin, TAbstractFile } from 'obsidian';
import { AdvancedSlidesSettings } from './@types';
import { RevealServer } from './reveal/revealServer';
import { ObsidianUtils } from './obsidian/obsidianUtils';
import { AutoCompleteSuggest } from './obsidian/suggesters/AutoCompleteSuggester';
import {
    REVEAL_PREVIEW_VIEW,
    RevealPreviewView,
} from './reveal/revealPreviewView';
import { LineSelectionListener } from './obsidian/suggesters/lineSelectionListener';
import {
    DEFAULT_SETTINGS,
    ICON_DATA,
    REFRESH_ICON,
} from './advancedSlides-constants';
import { AdvancedSlidesSettingTab } from './advancedSlides-SettingTab';
import { EmbeddedSlideProcessor } from './obsidian/embeddedSlideProcessor';
import { AdvancedSlidesDistribution } from './advancedSlides-Distribution';

export class AdvancedSlidesPlugin extends Plugin {
    settings: AdvancedSlidesSettings;
    obsidianUtils: ObsidianUtils;

    private revealServer: RevealServer;
    private autoCompleteSuggester: AutoCompleteSuggest;
    private target: TAbstractFile;
    private slideProcessor: EmbeddedSlideProcessor;

    async onload() {
        await this.loadSettings();
        this.obsidianUtils = new ObsidianUtils(this.app, this.settings);

        const version = this.manifest.version;
        const distribution = new AdvancedSlidesDistribution(this);
        console.log(
            'Advanced Slides v%s, needsReload=%s',
            version,
            distribution.isOutdated(),
        );

        try {
            this.configureServer();

            this.registerView(
                REVEAL_PREVIEW_VIEW,
                leaf =>
                    new RevealPreviewView(
                        leaf,
                        this.revealServer.getUrl(),
                        this.settings,
                        this.hideView.bind(this),
                    ),
            );
            this.registerEvent(
                this.app.vault.on('modify', this.onChange.bind(this)),
            );
            this.registerEditorSuggest(
                new LineSelectionListener(this.app, this),
            );

            addIcon('slides', ICON_DATA);
            addIcon('refresh', REFRESH_ICON);

            this.addRibbonIcon('slides', 'Show Slide Preview', async () => {
                await this.showView();
            });

            this.addCommand({
                id: 'open-advanced-slides-preview',
                name: 'Show Slide Preview',
                hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'E' }],
                callback: async () => this.toggleView(),
            });

            this.addCommand({
                id: 'reload-advanced-slides-preview',
                name: 'Reload Slide Preview',
                hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'R' }],
                callback: () => {
                    const instance = this.getViewInstance();
                    if (!instance) {
                        return;
                    }
                    instance.onChange();
                },
            });
            this.addCommand({
                id: 'stop-server-advanced-slides-preview',
                name: 'Stop Slide Preview Server',
                callback: async () => this.revealServer.stop(),
            });
            this.addCommand({
                id: 'start-server-advanced-slides-preview',
                name: 'Start Slide Preview Server',
                callback: async () => this.revealServer.start(),
            });

            this.addSettingTab(new AdvancedSlidesSettingTab(this.app, this));
            this.app.workspace.onLayoutReady(this.layoutReady);

            this.slideProcessor = new EmbeddedSlideProcessor(this);
            this.registerMarkdownCodeBlockProcessor(
                'slide',
                this.slideProcessor.handler,
            );
            this.registerMarkdownPostProcessor(
                this.obsidianUtils.markdownProcessor.postProcess,
            );
        } catch (err) {
            console.debug('Advanced Slides caught an error', err);
        }
    }

    layoutReady = async () => {
        this.autoCompleteSuggester = new AutoCompleteSuggest(this.app);

        if (this.settings.autoComplete == 'always') {
            this.autoCompleteSuggester.activate();
        } else {
            this.autoCompleteSuggester.deactivate();
        }
        this.registerEditorSuggest(this.autoCompleteSuggester);

        await this.initServer();
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
        if (file == this.target) {
            instance.onChange();
        }
    }

    async toggleView() {
        const instance = this.getViewInstance();
        if (instance) {
            this.app.workspace.detachLeavesOfType(REVEAL_PREVIEW_VIEW);
            if (this.settings.autoComplete == 'inPreview') {
                this.autoCompleteSuggester.deactivate();
            }
        } else {
            if (this.settings.autoComplete != 'never') {
                this.autoCompleteSuggester.activate();
            }
            await this.showView();
        }
    }

    hideView() {
        if (this.settings.autoComplete == 'inPreview') {
            this.autoCompleteSuggester.deactivate();
        }
    }

    async showView() {
        const targetDocument = this.app.workspace.getActiveFile();
        if (!targetDocument) {
            return;
        }
        if (
            targetDocument == this.target &&
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
            this.settings.port,
        );
    };

    initServer = async () => {
        if (this.settings.autoStart) {
            await this.revealServer.start();
        }

        const instance = this.getViewInstance();
        if (instance) {
            if (instance.url == 'about:blank') {
                await this.showView();
            }
        }
    };

    stopServer = async () => {
        await this.revealServer.stop();

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
        await this.app.workspace.getLeaf(this.settings.paneMode).setViewState({
            type: REVEAL_PREVIEW_VIEW,
            active: false,
        });
        this.app.workspace.revealLeaf(
            this.app.workspace.getLeavesOfType(REVEAL_PREVIEW_VIEW)[0],
        );
    }

    async onunload() {
        console.debug('unloading Advanced Slides');
        await this.stopServer();

        this.app.workspace
            .getLeavesOfType(REVEAL_PREVIEW_VIEW)
            .forEach(leaf => leaf.detach());
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
        console.debug('Advanced Slides: settings saved');

        await this.stopServer();
        this.obsidianUtils = new ObsidianUtils(this.app, this.settings);
        this.configureServer();
        await this.initServer();
        const instance = this.getViewInstance();
        if (instance) {
            await instance.onChange();
        }
    }

    async update(newSettings: AdvancedSlidesSettings) {
        if (
            newSettings.themeDirectory &&
            this.settings.themeDirectory != newSettings.themeDirectory
        ) {
            const distribution = new AdvancedSlidesDistribution(this);
            distribution.copyThemes(newSettings.themeDirectory);
        }
        this.settings = newSettings;
        await this.saveSettings();
    }
}
