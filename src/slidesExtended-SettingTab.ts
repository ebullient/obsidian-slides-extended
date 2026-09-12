import {
    type App,
    Notice,
    PluginSettingTab,
    type Setting,
    type SettingDefinitionItem,
    type SettingGroup,
    type TAbstractFile,
    TFolder,
} from "obsidian";
import { FolderInputSuggest } from "obsidian-utilities";
import type { SlidesExtendedSettings } from "./@types";
import {
    getThemeFiles,
    ThemeInputSuggest,
} from "./obsidian/suggesters/ThemeSuggester";
import { DEFAULT_SETTINGS } from "./slidesExtended-constants";
import type { SlidesExtendedPlugin } from "./slidesExtended-Plugin";
import { validateAssetsDirectory } from "./slidesExtended-SettingsData";

/** This is because TypeScript's filters are dumb. */
function isFolder(file: TAbstractFile): file is TFolder {
    return file instanceof TFolder;
}

export class SlidesExtendedSettingTab extends PluginSettingTab {
    plugin: SlidesExtendedPlugin;

    constructor(app: App, plugin: SlidesExtendedPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    async setControlValue(key: string, value: unknown): Promise<void> {
        const settings = {
            ...this.plugin.settings,
            [key]: value,
        };
        await this.plugin.update(settings);
    }

    getSettingDefinitions(): SettingDefinitionItem[] {
        const settings = this.plugin.settings;

        const themeDesc = (type: string, assets: string) => {
            const desc =
                type === "slide" ? "*" : "*.highlight.css or *.hljs.css";
            if (assets) {
                return `Select the default ${desc} theme. Options include ${type}.css files defined in ${assets}.`;
            }
            return `Select the default ${desc} theme.`;
        };

        return [
            {
                type: "group",
                heading: "Backup and restore",
                items: [
                    {
                        name: "Export settings",
                        desc: "Save the current settings to a JSON file.",
                        render: (setting: Setting) => {
                            setting.addButton((btn) =>
                                btn.setButtonText("Export").onClick(() => {
                                    const blob = new Blob(
                                        [
                                            JSON.stringify(
                                                this.plugin.settings,
                                                null,
                                                2,
                                            ),
                                        ],
                                        { type: "application/json" },
                                    );
                                    const url = URL.createObjectURL(blob);
                                    const anchor = createEl("a", {
                                        href: url,
                                        attr: {
                                            download:
                                                "slides-extended-settings.json",
                                        },
                                    });
                                    anchor.click();
                                    URL.revokeObjectURL(url);
                                }),
                            );
                        },
                    },
                    {
                        name: "Import settings",
                        desc: "Load settings from a previously exported JSON file.",
                        render: (setting: Setting) => {
                            const fileInput = setting.controlEl.createEl(
                                "input",
                                {
                                    type: "file",
                                    cls: "slides-extended-hidden-file-input",
                                    attr: { accept: "application/json,.json" },
                                },
                            );
                            fileInput.addEventListener("change", () => {
                                const file = fileInput.files?.item(0);
                                fileInput.value = "";
                                if (!file) {
                                    return;
                                }
                                file.text()
                                    .then((contents) => {
                                        let parsed: Partial<SlidesExtendedSettings>;
                                        try {
                                            parsed = JSON.parse(
                                                contents,
                                            ) as Partial<SlidesExtendedSettings>;
                                        } catch (err) {
                                            console.error(
                                                "Slides Extended: failed to parse imported settings",
                                                err,
                                            );
                                            new Notice(
                                                "Slides Extended: that file doesn't contain valid JSON.",
                                            );
                                            return;
                                        }
                                        const imported = Object.assign(
                                            {},
                                            DEFAULT_SETTINGS,
                                            parsed,
                                        );
                                        void this.plugin
                                            .update(imported)
                                            .then(() => {
                                                new Notice(
                                                    "Slides Extended: settings imported.",
                                                );
                                                this.update();
                                            });
                                    })
                                    .catch((err: unknown) => {
                                        console.error(
                                            "Slides Extended: failed to read settings file",
                                            err,
                                        );
                                        new Notice(
                                            "Slides Extended: failed to read the settings file.",
                                        );
                                    });
                            });
                            setting.addButton((btn) =>
                                btn.setButtonText("Import").onClick(() => {
                                    fileInput.click();
                                }),
                            );
                        },
                    },
                ],
            },
            {
                name: "Slide preview mode",
                desc: "Select the slide preview pane display mode.",
                control: {
                    type: "dropdown",
                    key: "paneMode",
                    options: {
                        tab: "As tab",
                        split: "Split workspace",
                        sidebar: "Right sidebar",
                    },
                },
            },
            {
                name: "Automatically start the preview server",
                control: { type: "toggle", key: "autoStart" },
            },
            {
                name: "Server port",
                desc: "Specify the port number for the server to listen on. Default is 3000.",
                control: {
                    type: "text",
                    key: "port",
                    placeholder: "3000",
                },
            },
            {
                name: "Server host",
                desc: "Specify the host for the server to listen on. Default is localhost. Use 0.0.0.0 to allow external connections.",
                control: {
                    type: "text",
                    key: "host",
                    placeholder: "localhost",
                },
            },
            {
                name: "Auto reload",
                desc: "When enabled, the slide preview window automatically updates upon detecting changes in the source file.",
                control: { type: "toggle", key: "autoReload" },
            },
            {
                name: "Auto complete",
                desc: 'Enable auto-complete inputs. "Always" enables it everywhere, "When slide preview is active" enables it only when the slide preview is active, and "Never" disables it.',
                control: {
                    type: "dropdown",
                    key: "autoComplete",
                    options: {
                        always: "Always",
                        inPreview: "When slide preview is active",
                        never: "Never",
                    },
                },
            },
            {
                name: "Export directory",
                desc: "Specify the directory where Slides Extended should export presentations.",
                render: (setting: Setting) => {
                    setting.addSearch((cb) => {
                        const folders: TFolder[] = this.app.vault
                            .getAllLoadedFiles()
                            .filter<TFolder>(isFolder);
                        const modal = new FolderInputSuggest(
                            this.app,
                            cb,
                            folders,
                        );
                        modal.onSelect(({ item }) => {
                            cb.setValue(item.path);
                            cb.inputEl.trigger("input");
                            modal.close();
                        });
                        cb.setPlaceholder("Folder")
                            .setValue(this.plugin.settings.exportDirectory)
                            .onChange(async (value) => {
                                await this.setControlValue(
                                    "exportDirectory",
                                    value,
                                );
                            });
                    });
                },
            },
            {
                name: "Assets directory",
                desc: "Specify a vault directory for custom themes, CSS, scripts, and HTML templates. CSS files are searched in css/. Scripts are searched in js/. HTML templates in html/.",
                render: (setting: Setting) => {
                    setting.addSearch((cb) => {
                        const folders: TFolder[] = this.app.vault
                            .getAllLoadedFiles()
                            .filter<TFolder>(isFolder);
                        const modal = new FolderInputSuggest(
                            this.app,
                            cb,
                            folders,
                        );
                        modal.onSelect(({ item }) => {
                            cb.setValue(item.path);
                            cb.inputEl.trigger("input");
                            modal.close();
                        });
                        cb.setPlaceholder("Folder")
                            .setValue(this.plugin.settings.assetsDirectory)
                            .onChange(async (value) => {
                                const error = validateAssetsDirectory(value);
                                if (error) {
                                    new Notice(`Slides Extended: ${error}`);
                                    return;
                                }
                                await this.setControlValue(
                                    "assetsDirectory",
                                    value,
                                );
                                this.update();
                            });
                    });
                },
            },
            {
                type: "group",
                heading: "Custom scripts",
                items: [
                    {
                        name: "Scripts",
                        desc: "Comma-separated local script paths (resolved from vault or theme directory).",
                        control: {
                            type: "text",
                            key: "scripts",
                            placeholder: "my-plugin.js, utils.js",
                        },
                    },
                    {
                        name: "Remote scripts",
                        desc: "Comma-separated external script URLs.",
                        control: {
                            type: "text",
                            key: "remoteScripts",
                            placeholder: "https://cdn.example.com/lib.js",
                        },
                    },
                ],
            },
            {
                type: "group",
                heading: "Slides",
                items: [
                    {
                        name: "Default slide theme",
                        desc: themeDesc("slide", settings.assetsDirectory),
                        render: (setting: Setting) => {
                            setting.addSearch((cb) => {
                                const modal = new ThemeInputSuggest(
                                    this.app,
                                    cb,
                                    getThemeFiles(
                                        this.plugin.obsidianUtils,
                                        "theme",
                                    ),
                                ).onSelect(({ item }) => {
                                    cb.setValue(item);
                                    cb.inputEl.trigger("input");
                                    modal.close();
                                });
                                cb.setPlaceholder("black")
                                    .setValue(this.plugin.settings.theme)
                                    .onChange(async (value) => {
                                        await this.setControlValue(
                                            "theme",
                                            value,
                                        );
                                    });
                            });
                        },
                    },
                    {
                        name: "Default highlight theme",
                        desc: themeDesc("highlight", settings.assetsDirectory),
                        render: (setting: Setting) => {
                            setting.addSearch((cb) => {
                                const modal = new ThemeInputSuggest(
                                    this.app,
                                    cb,
                                    getThemeFiles(
                                        this.plugin.obsidianUtils,
                                        "highlight",
                                    ),
                                ).onSelect(({ item }) => {
                                    cb.setValue(item);
                                    cb.inputEl.trigger("input");
                                    modal.close();
                                });
                                cb.setPlaceholder("zenburn")
                                    .setValue(
                                        this.plugin.settings.highlightTheme,
                                    )
                                    .onChange(async (value) => {
                                        await this.setControlValue(
                                            "highlightTheme",
                                            value,
                                        );
                                    });
                            });
                        },
                    },
                    {
                        name: "Center content",
                        desc: "When enabled, content is centered on the slide by default.",
                        control: { type: "toggle", key: "center" },
                    },
                    {
                        name: "Transition style",
                        desc: "Select a default slide transition",
                        control: {
                            type: "dropdown",
                            key: "transition",
                            options: {
                                none: "none",
                                fade: "fade",
                                slide: "slide",
                                convex: "convex",
                                concave: "concave",
                                zoom: "zoom",
                            },
                        },
                    },
                    {
                        name: "Transition speed",
                        desc: "Select a default transition speed",
                        control: {
                            type: "dropdown",
                            key: "transitionSpeed",
                            options: {
                                slow: "slow",
                                normal: "default",
                                fast: "fast",
                            },
                        },
                    },
                    {
                        name: "Default horizontal slide separator",
                        desc: "Regex pattern used to split horizontal slides. Default: \\r?\\n---\\r?\\n. Override per-note with the 'separator' property.",
                        control: {
                            type: "text",
                            key: "separator",
                            placeholder: "\\r?\\n---\\r?\\n",
                        },
                    },
                    {
                        name: "Default vertical slide separator",
                        desc: "Regex pattern used to split vertical slides. Default: \\r?\\n--\\r?\\n. Override per-note with the 'verticalSeparator' property.",
                        control: {
                            type: "text",
                            key: "verticalSeparator",
                            placeholder: "\\r?\\n--\\r?\\n",
                        },
                    },
                ],
            },
            {
                type: "group",
                heading: "Presentation plugins",
                items: [
                    {
                        name: "Controls",
                        desc: "Display presentation control arrows.",
                        render: (setting: Setting, _group: SettingGroup) => {
                            setting
                                .addButton((btn) => {
                                    btn.setButtonText(
                                        "enableCustomControls",
                                    ).setDisabled(true);
                                })
                                .addToggle((value) =>
                                    value
                                        .setValue(this.plugin.settings.controls)
                                        .onChange(async (value) => {
                                            await this.setControlValue(
                                                "controls",
                                                value,
                                            );
                                        }),
                                );
                        },
                    },
                    {
                        name: "Chalkboard",
                        desc: "Display a chalkboard and related controls.",
                        render: (setting: Setting) => {
                            setting
                                .addButton((btn) => {
                                    btn.setButtonText(
                                        "enableChalkboard",
                                    ).setDisabled(true);
                                })
                                .addToggle((value) =>
                                    value
                                        .setValue(
                                            this.plugin.settings
                                                .enableChalkboard,
                                        )
                                        .onChange(async (value) => {
                                            await this.setControlValue(
                                                "enableChalkboard",
                                                value,
                                            );
                                        }),
                                );
                        },
                    },
                    {
                        name: "Elapsed time bar",
                        desc: "Display an elapsed time bar; set 'timeForPresentation' property in seconds (500), minutes (55m), or hours (1h).",
                        render: (setting: Setting) => {
                            setting
                                .addButton((btn) => {
                                    btn.setButtonText(
                                        "enableTimeBar",
                                    ).setDisabled(true);
                                })
                                .addToggle((value) =>
                                    value
                                        .setValue(
                                            this.plugin.settings.enableTimeBar,
                                        )
                                        .onChange(async (value) => {
                                            await this.setControlValue(
                                                "enableTimeBar",
                                                value,
                                            );
                                        }),
                                );
                        },
                    },
                    {
                        name: "Laser pointer",
                        desc: "Change your mouse into a laser pointer (toggle with Q).",
                        render: (setting: Setting) => {
                            setting
                                .addButton((btn) => {
                                    btn.setButtonText(
                                        "enablePointer",
                                    ).setDisabled(true);
                                })
                                .addToggle((value) =>
                                    value
                                        .setValue(
                                            this.plugin.settings.enablePointer,
                                        )
                                        .onChange(async (value) => {
                                            await this.setControlValue(
                                                "enablePointer",
                                                value,
                                            );
                                        }),
                                );
                        },
                    },
                    {
                        name: "Menu",
                        desc: "Display a presentation menu button.",
                        render: (setting: Setting) => {
                            setting
                                .addButton((btn) => {
                                    btn.setButtonText("enableMenu").setDisabled(
                                        true,
                                    );
                                })
                                .addToggle((value) =>
                                    value
                                        .setValue(
                                            this.plugin.settings.enableMenu,
                                        )
                                        .onChange(async (value) => {
                                            await this.setControlValue(
                                                "enableMenu",
                                                value,
                                            );
                                        }),
                                );
                        },
                    },
                    {
                        name: "Overview",
                        desc: "When enabled, display a presentation overview button.",
                        render: (setting: Setting) => {
                            setting
                                .addButton((btn) => {
                                    btn.setButtonText(
                                        "enableOverview",
                                    ).setDisabled(true);
                                })
                                .addToggle((value) =>
                                    value
                                        .setValue(
                                            this.plugin.settings.enableOverview,
                                        )
                                        .onChange(async (value) => {
                                            await this.setControlValue(
                                                "enableOverview",
                                                value,
                                            );
                                        }),
                                );
                        },
                    },
                    {
                        name: "Progress bar (progress)",
                        desc: "When enabled, display a presentation progress bar.",
                        render: (setting: Setting) => {
                            setting
                                .addButton((btn) => {
                                    btn.setButtonText("progress").setDisabled(
                                        true,
                                    );
                                })
                                .addToggle((value) =>
                                    value
                                        .setValue(this.plugin.settings.progress)
                                        .onChange(async (value) => {
                                            await this.setControlValue(
                                                "progress",
                                                value,
                                            );
                                        }),
                                );
                        },
                    },
                    {
                        name: "Slide numbers",
                        desc: "Display the page number of the current slide.",
                        render: (setting: Setting) => {
                            setting
                                .addButton((btn) => {
                                    btn.setButtonText(
                                        "slideNumber",
                                    ).setDisabled(true);
                                })
                                .addToggle((value) =>
                                    value
                                        .setValue(
                                            this.plugin.settings.slideNumber,
                                        )
                                        .onChange(async (value) => {
                                            await this.setControlValue(
                                                "slideNumber",
                                                value,
                                            );
                                        }),
                                );
                        },
                    },
                    {
                        name: "Math engine",
                        desc: "Select the math rendering engine.",
                        control: {
                            type: "dropdown",
                            key: "mathEngine",
                            options: {
                                katex: "KaTeX",
                                mathjax: "MathJax",
                            },
                        },
                    },
                ],
            },
        ];
    }
}
