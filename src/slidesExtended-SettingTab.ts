import {
    App,
    PluginSettingTab,
    Setting,
    TAbstractFile,
    TFolder,
} from 'obsidian';
import { FolderInputSuggest } from 'obsidian-utilities';
import {
    ThemeInputSuggest,
    getThemeFiles,
} from './obsidian/suggesters/ThemeSuggester';
import { SlidesExtendedPlugin } from './slidesExtended-Plugin';
import { SlidesExtendedSettings } from './@types';

/** This is because TypeScript's filters are dumb. */
function isFolder(file: TAbstractFile): file is TFolder {
    return file instanceof TFolder;
}
export class SlidesExtendedSettingTab extends PluginSettingTab {
    plugin: SlidesExtendedPlugin;
    newSettings: SlidesExtendedSettings;

    constructor(app: App, plugin: SlidesExtendedPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    async save() {
        await this.plugin.update(this.newSettings);
    }

    /** Save on exit */
    hide(): void {
        this.save();
    }

    /** Show/validate setting changes */
    display(): void {
        this.newSettings = JSON.parse(JSON.stringify(this.plugin.settings));
        this.drawElements();
    }

    drawElements(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Slide preview mode')
            .setDesc('Select the slide preview pane display mode.')
            .addDropdown(cb => {
                cb.addOption('tab', 'as Tab')
                    .addOption('split', 'split Workspace')
                    .addOption('sidebar', 'right sidebar')
                    .setValue(this.newSettings.paneMode)
                    .onChange(value => {
                        if (
                            value == 'tab' ||
                            value == 'split' ||
                            value == 'sidebar'
                        ) {
                            this.newSettings.paneMode = value;
                        } else {
                            console.debug('Invalid pane mode', value);
                        }
                    });
            });

        new Setting(containerEl)
            .setName('Automatically start server')
            .setDesc(
                'When enabled, the server for rendering slides will automatically start when Obsidian starts.',
            )
            .addToggle(value =>
                value.setValue(this.newSettings.autoStart).onChange(value => {
                    this.newSettings.autoStart = value;
                }),
            );

        new Setting(containerEl)
            .setName('Server port')
            .setDesc(
                'Specify the port number for the server to listen on. Default is 3000.',
            )
            .addText(text =>
                text
                    .setPlaceholder('3000')
                    .setValue(this.newSettings.port)
                    .onChange(value => {
                        this.newSettings.port = value;
                    }),
            );

        new Setting(containerEl)
            .setName('Auto reload')
            .setDesc(
                'When enabled, the slide preview window automatically updates upon detecting changes in the source file.',
            )
            .addToggle(value =>
                value.setValue(this.newSettings.autoReload).onChange(value => {
                    this.newSettings.autoReload = value;
                }),
            );

        // new Setting(containerEl)
        //     .setName('Auto complete')
        //     .setDesc('Do you want to auto-complete inputs?')
        //     .addDropdown(cb => {
        //         cb.addOption('always', 'Always')
        //             .addOption('inPreview', 'only in slide preview')
        //             .addOption('never', 'Never')
        //             .setValue(this.newSettings.autoComplete)
        //             .onChange(value => {
        //                 this.newSettings.autoComplete = value;
        //             });
        //     });

        new Setting(containerEl)
            .setName('Export directory')
            .setDesc(
                'Specify the directory where Slides Extended should export presentations.',
            )
            .addSearch(cb => {
                const folders: TFolder[] = this.app.vault
                    .getAllLoadedFiles()
                    .filter<TFolder>(isFolder);
                const modal = new FolderInputSuggest(this.app, cb, folders);
                modal.onSelect(({ item }) => {
                    cb.setValue(item.path);
                    cb.inputEl.trigger('input');
                    modal.close();
                });
                cb.setPlaceholder('Folder')
                    .setValue(this.newSettings.exportDirectory)
                    .onChange(value => {
                        this.newSettings.exportDirectory = value;
                    });
            });

        const themeSettings: Record<string, Setting> = {};
        const themeDesc = (type: string, assets: string) => {
            const desc =
                type == 'slide' ? '*' : '*.highlight.css or *.hljs.css';
            if (assets) {
                return `Select the default ${desc} theme. Options include ${type}.css files defined in ${assets}.`;
            } else {
                return `Select the default ${desc} theme.`;
            }
        };

        new Setting(containerEl)
            .setName('Theme directory')
            .setDesc(
                'Specify the vault directory for custom themes. Highlight themes should include "highlight" or "hljs" in their name.',
            )
            .addSearch(cb => {
                const folders: TFolder[] = this.app.vault
                    .getAllLoadedFiles()
                    .filter<TFolder>(isFolder);
                const modal = new FolderInputSuggest(this.app, cb, folders);
                modal.onSelect(({ item }) => {
                    cb.setValue(item.path);
                    cb.inputEl.trigger('input');
                    modal.close();
                });
                cb.setPlaceholder('Folder')
                    .setValue(this.newSettings.themeDirectory)
                    .onChange(value => {
                        this.newSettings.themeDirectory = value;
                        for (const key in themeSettings) {
                            themeSettings[key].setDesc(themeDesc(key, value));
                        }
                    });
            });

        new Setting(containerEl).setName('Slides').setHeading();

        themeSettings['slide'] = new Setting(containerEl)
            .setName('Default slide theme')
            .setDesc(themeDesc('slide', this.newSettings.themeDirectory))
            .addSearch(cb => {
                const modal = new ThemeInputSuggest(
                    this.app,
                    cb,
                    getThemeFiles(this.plugin.obsidianUtils, 'theme'),
                ).onSelect(({ item }) => {
                    cb.setValue(item);
                    cb.inputEl.trigger('input');
                    modal.close();
                });
                cb.setPlaceholder('black')
                    .setValue(this.newSettings.theme)
                    .onChange(value => {
                        this.newSettings.theme = value;
                    });
            });

        themeSettings['highlight'] = new Setting(containerEl)
            .setName('Default highlight theme')
            .setDesc(themeDesc('highlight', this.newSettings.themeDirectory))
            .addSearch(cb => {
                const modal = new ThemeInputSuggest(
                    this.app,
                    cb,
                    getThemeFiles(this.plugin.obsidianUtils, 'highlight'),
                ).onSelect(({ item }) => {
                    cb.setValue(item);
                    cb.inputEl.trigger('input');
                    modal.close();
                });
                cb.setPlaceholder('zenburn')
                    .setValue(this.newSettings.highlightTheme)
                    .onChange(value => {
                        this.newSettings.highlightTheme = value;
                    });
            });

        new Setting(containerEl)
            .setName('Center content')
            .setDesc(
                'When enabled, content is centered on the slide by default.',
            )
            .addToggle(value =>
                value.setValue(this.newSettings.center).onChange(value => {
                    this.newSettings.center = value;
                }),
            );

        new Setting(containerEl)
            .setName('Transition style')
            .setDesc('Select a default slide transition')
            .addDropdown(cb => {
                cb.addOption('none', 'none')
                    .addOption('fade', 'fade')
                    .addOption('slide', 'slide')
                    .addOption('convex', 'convex')
                    .addOption('concave', 'concave')
                    .addOption('zoom', 'zoom')
                    .setValue(this.newSettings.transition)
                    .onChange(value => {
                        this.newSettings.transition = value;
                    });
            });

        new Setting(containerEl)
            .setName('Transition speed')
            .setDesc('Select a default transition speed')
            .addDropdown(cb => {
                cb.addOption('slow', 'slow')
                    .addOption('normal', 'default')
                    .addOption('fast', 'fast')
                    .setValue(this.newSettings.transitionSpeed)
                    .onChange(value => {
                        this.newSettings.transitionSpeed = value;
                    });
            });

        containerEl.createEl('h2', { text: 'Plugins' });

        new Setting(containerEl)
            .setName('Controls')
            .setDesc('When enabled, display presentation control arrows.')
            .addToggle(value =>
                value.setValue(this.newSettings.controls).onChange(value => {
                    this.newSettings.controls = value;
                }),
            );

        new Setting(containerEl)
            .setName('Chalkboard')
            .setDesc('When enabled, the slides will contain a chalkboard.')
            .addToggle(value =>
                value
                    .setValue(this.newSettings.enableChalkboard)
                    .onChange(value => {
                        this.newSettings.enableChalkboard = value;
                    }),
            );

        new Setting(containerEl)
            .setName('Elapsed time bar')
            .setDesc('When enabled, display an elapsed time bar.')
            .addToggle(value =>
                value
                    .setValue(this.newSettings.enableTimeBar)
                    .onChange(value => {
                        this.newSettings.enableTimeBar = value;
                    }),
            );

        new Setting(containerEl)
            .setName('Laser pointer')
            .setDesc(
                'When enabled, changes your mouse into a laser pointer (Toggle with Q).',
            )
            .addToggle(value =>
                value
                    .setValue(this.newSettings.enablePointer)
                    .onChange(value => {
                        this.newSettings.enablePointer = value;
                    }),
            );

        new Setting(containerEl)
            .setName('Menu')
            .setDesc('When enabled, display a presentation menu button.')
            .addToggle(value =>
                value.setValue(this.newSettings.enableMenu).onChange(value => {
                    this.newSettings.enableMenu = value;
                }),
            );

        new Setting(containerEl)
            .setName('Overview')
            .setDesc('When enabled, display a presentation overview button.')
            .addToggle(value =>
                value
                    .setValue(this.newSettings.enableOverview)
                    .onChange(value => {
                        this.newSettings.enableOverview = value;
                    }),
            );

        new Setting(containerEl)
            .setName('Progress bar')
            .setDesc('When enabled, display a presentation progress bar.')
            .addToggle(value =>
                value.setValue(this.newSettings.progress).onChange(value => {
                    this.newSettings.progress = value;
                }),
            );

        new Setting(containerEl)
            .setName('Slide numbers')
            .setDesc(
                'When enabled, display the page number of the current slide.',
            )
            .addToggle(value =>
                value.setValue(this.newSettings.slideNumber).onChange(value => {
                    this.newSettings.slideNumber = value;
                }),
            );
    }
}
