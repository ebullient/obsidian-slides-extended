import {
    type App,
    Notice,
    PluginSettingTab,
    Setting,
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

/** This is because TypeScript's filters are dumb. */
function isFolder(file: TAbstractFile): file is TFolder {
    return file instanceof TFolder;
}

export class SlidesExtendedSettingTab extends PluginSettingTab {
    plugin: SlidesExtendedPlugin;
    newSettings!: SlidesExtendedSettings;

    constructor(app: App, plugin: SlidesExtendedPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    async save() {
        await this.plugin.update(this.newSettings);
    }

    /** Save on exit */
    hide(): void {
        void this.save();
    }

    /** Show/validate setting changes */
    display(): void {
        this.newSettings = JSON.parse(
            JSON.stringify(this.plugin.settings),
        ) as SlidesExtendedSettings;
        this.drawElements();
    }

    drawElements(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("Backup and restore")
            .setHeading()
            .setDesc("Save and restore plugin settings");

        new Setting(containerEl)
            .setName("Export settings")
            .setDesc("Save the current settings to a JSON file.")
            .addButton((btn) =>
                btn.setButtonText("Export").onClick(() => {
                    const blob = new Blob(
                        [JSON.stringify(this.plugin.settings, null, 2)],
                        { type: "application/json" },
                    );
                    const url = URL.createObjectURL(blob);
                    const anchor = document.createElement("a");
                    anchor.href = url;
                    anchor.download = "slides-extended-settings.json";
                    anchor.click();
                    URL.revokeObjectURL(url);
                }),
            );

        const fileInput = containerEl.createEl("input", {
            type: "file",
            attr: { accept: "application/json,.json" },
        });
        fileInput.style.display = "none";
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
                    void this.plugin.update(imported).then(() => {
                        new Notice("Slides Extended: settings imported.");
                        this.display();
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

        new Setting(containerEl)
            .setName("Import settings")
            .setDesc("Load settings from a previously exported JSON file.")
            .addButton((btn) =>
                btn.setButtonText("Import").onClick(() => {
                    fileInput.click();
                }),
            );

        new Setting(containerEl)
            .setName("Slide preview mode")
            .setDesc("Select the slide preview pane display mode.")
            .addDropdown((cb) => {
                cb.addOption("tab", "As tab")
                    .addOption("split", "Split workspace")
                    .addOption("sidebar", "Right sidebar")
                    .setValue(this.newSettings.paneMode)
                    .onChange((value) => {
                        if (
                            value === "tab" ||
                            value === "split" ||
                            value === "sidebar"
                        ) {
                            this.newSettings.paneMode = value;
                        } else {
                            console.debug("Invalid pane mode", value);
                        }
                    });
            });

        new Setting(containerEl)
            .setName("Automatically start the preview server")
            .addToggle((value) =>
                value.setValue(this.newSettings.autoStart).onChange((value) => {
                    this.newSettings.autoStart = value;
                }),
            );

        new Setting(containerEl)
            .setName("Server port")
            .setDesc(
                "Specify the port number for the server to listen on. Default is 3000.",
            )
            .addText((text) =>
                text
                    .setPlaceholder("3000")
                    .setValue(this.newSettings.port)
                    .onChange((value) => {
                        this.newSettings.port = value;
                    }),
            );

        new Setting(containerEl)
            .setName("Server host")
            .setDesc(
                "Specify the host for the server to listen on. Default is localhost. Use 0.0.0.0 to allow external connections.",
            )
            .addText((text) =>
                text
                    .setPlaceholder("localhost")
                    .setValue(this.newSettings.host)
                    .onChange((value) => {
                        this.newSettings.host = value;
                    }),
            );

        new Setting(containerEl)
            .setName("Auto reload")
            .setDesc(
                "When enabled, the slide preview window automatically updates upon detecting changes in the source file.",
            )
            .addToggle((value) =>
                value
                    .setValue(this.newSettings.autoReload)
                    .onChange((value) => {
                        this.newSettings.autoReload = value;
                    }),
            );

        new Setting(containerEl)
            .setName("Auto complete")
            .setDesc(
                'Enable auto-complete inputs. "Always" enables it everywhere, "When slide preview is active" enables it only when the slide preview is active, and "Never" disables it.',
            )
            .addDropdown((cb) => {
                cb.addOption("always", "Always")
                    .addOption("inPreview", "When slide preview is active")
                    .addOption("never", "Never")
                    .setValue(this.newSettings.autoComplete)
                    .onChange((value) => {
                        this.newSettings.autoComplete = value;
                    });
            });

        new Setting(containerEl)
            .setName("Export directory")
            .setDesc(
                "Specify the directory where Slides Extended should export presentations.",
            )
            .addSearch((cb) => {
                const folders: TFolder[] = this.app.vault
                    .getAllLoadedFiles()
                    .filter<TFolder>(isFolder);
                const modal = new FolderInputSuggest(this.app, cb, folders);
                modal.onSelect(({ item }) => {
                    cb.setValue(item.path);
                    cb.inputEl.trigger("input");
                    modal.close();
                });
                cb.setPlaceholder("Folder")
                    .setValue(this.newSettings.exportDirectory)
                    .onChange((value) => {
                        this.newSettings.exportDirectory = value;
                    });
            });

        const themeSettings: Record<string, Setting> = {};
        const themeDesc = (type: string, assets: string) => {
            const desc =
                type === "slide" ? "*" : "*.highlight.css or *.hljs.css";
            if (assets) {
                return `Select the default ${desc} theme. Options include ${type}.css files defined in ${assets}.`;
            }
            return `Select the default ${desc} theme.`;
        };

        new Setting(containerEl)
            .setName("Assets directory")
            .setDesc(
                "Specify a vault directory for custom themes, CSS, scripts, and HTML templates. CSS files are searched in css/ and the directory root. Scripts are searched in js/. HTML templates in html/.",
            )
            .addSearch((cb) => {
                const folders: TFolder[] = this.app.vault
                    .getAllLoadedFiles()
                    .filter<TFolder>(isFolder);
                const modal = new FolderInputSuggest(this.app, cb, folders);
                modal.onSelect(({ item }) => {
                    cb.setValue(item.path);
                    cb.inputEl.trigger("input");
                    modal.close();
                });
                cb.setPlaceholder("Folder")
                    .setValue(this.newSettings.assetsDirectory)
                    .onChange((value) => {
                        this.newSettings.assetsDirectory = value;
                        for (const key in themeSettings) {
                            themeSettings[key].setDesc(themeDesc(key, value));
                        }
                    });
            });

        new Setting(containerEl)
            .setName("Custom scripts")
            .setHeading()
            .setDesc(
                "Load additional scripts into all presentations. Override per-note using property names.",
            );

        new Setting(containerEl)
            .setName("Scripts")
            .setDesc(
                "Comma-separated local script paths (resolved from vault or theme directory).",
            )
            .addText((text) =>
                text
                    .setPlaceholder("my-plugin.js, utils.js")
                    .setValue(this.newSettings.scripts)
                    .onChange((value) => {
                        this.newSettings.scripts = value;
                    }),
            );

        new Setting(containerEl)
            .setName("Remote scripts")
            .setDesc("Comma-separated external script URLs.")
            .addText((text) =>
                text
                    .setPlaceholder("https://cdn.example.com/lib.js")
                    .setValue(this.newSettings.remoteScripts)
                    .onChange((value) => {
                        this.newSettings.remoteScripts = value;
                    }),
            );

        new Setting(containerEl).setName("Slides").setHeading();

        themeSettings.slide = new Setting(containerEl)
            .setName("Default slide theme")
            .setDesc(themeDesc("slide", this.newSettings.assetsDirectory))
            .addSearch((cb) => {
                const modal = new ThemeInputSuggest(
                    this.app,
                    cb,
                    getThemeFiles(this.plugin.obsidianUtils, "theme"),
                ).onSelect(({ item }) => {
                    cb.setValue(item);
                    cb.inputEl.trigger("input");
                    modal.close();
                });
                cb.setPlaceholder("black")
                    .setValue(this.newSettings.theme)
                    .onChange((value) => {
                        this.newSettings.theme = value;
                    });
            });

        themeSettings.highlight = new Setting(containerEl)
            .setName("Default highlight theme")
            .setDesc(themeDesc("highlight", this.newSettings.assetsDirectory))
            .addSearch((cb) => {
                const modal = new ThemeInputSuggest(
                    this.app,
                    cb,
                    getThemeFiles(this.plugin.obsidianUtils, "highlight"),
                ).onSelect(({ item }) => {
                    cb.setValue(item);
                    cb.inputEl.trigger("input");
                    modal.close();
                });
                cb.setPlaceholder("zenburn")
                    .setValue(this.newSettings.highlightTheme)
                    .onChange((value) => {
                        this.newSettings.highlightTheme = value;
                    });
            });

        new Setting(containerEl)
            .setName("Center content")
            .setDesc(
                "When enabled, content is centered on the slide by default.",
            )
            .addToggle((value) =>
                value.setValue(this.newSettings.center).onChange((value) => {
                    this.newSettings.center = value;
                }),
            );

        new Setting(containerEl)
            .setName("Transition style")
            .setDesc("Select a default slide transition")
            .addDropdown((cb) => {
                cb.addOption("none", "none")
                    .addOption("fade", "fade")
                    .addOption("slide", "slide")
                    .addOption("convex", "convex")
                    .addOption("concave", "concave")
                    .addOption("zoom", "zoom")
                    .setValue(this.newSettings.transition)
                    .onChange((value) => {
                        this.newSettings.transition = value;
                    });
            });

        new Setting(containerEl)
            .setName("Transition speed")
            .setDesc("Select a default transition speed")
            .addDropdown((cb) => {
                cb.addOption("slow", "slow")
                    .addOption("normal", "default")
                    .addOption("fast", "fast")
                    .setValue(this.newSettings.transitionSpeed)
                    .onChange((value) => {
                        this.newSettings.transitionSpeed = value;
                    });
            });

        new Setting(containerEl)
            .setName("Default horizontal slide separator")
            .setDesc(
                "Regex pattern used to split horizontal slides. Default: \\r?\\n---\\r?\\n. Override per-note with the 'separator' property.",
            )
            .addText((text) =>
                text
                    .setPlaceholder("\\r?\\n---\\r?\\n")
                    .setValue(this.newSettings.separator)
                    .onChange((value) => {
                        this.newSettings.separator = value;
                    }),
            );

        new Setting(containerEl)
            .setName("Default vertical slide separator")
            .setDesc(
                "Regex pattern used to split vertical slides. Default: \\r?\\n--\\r?\\n. Override per-note with the 'verticalSeparator' property.",
            )
            .addText((text) =>
                text
                    .setPlaceholder("\\r?\\n--\\r?\\n")
                    .setValue(this.newSettings.verticalSeparator)
                    .onChange((value) => {
                        this.newSettings.verticalSeparator = value;
                    }),
            );

        new Setting(containerEl)
            .setName("Presentation plugins")
            .setHeading()
            .setDesc(
                "Control presentation plugins. Override per-note using property names (e.g., enableCustomControls).",
            );

        new Setting(containerEl)
            .setName("Controls")
            .setDesc("Display presentation control arrows.")
            .addButton((btn) => {
                btn.setButtonText("enableCustomControls").setDisabled(true);
            })
            .addToggle((value) =>
                value.setValue(this.newSettings.controls).onChange((value) => {
                    this.newSettings.controls = value;
                }),
            );

        new Setting(containerEl)
            .setName("Chalkboard")
            .setDesc("Display a chalkboard and related controls.")
            .addButton((btn) => {
                btn.setButtonText("enableChalkboard").setDisabled(true);
            })
            .addToggle((value) =>
                value
                    .setValue(this.newSettings.enableChalkboard)
                    .onChange((value) => {
                        this.newSettings.enableChalkboard = value;
                    }),
            );

        new Setting(containerEl)
            .setName("Canvas pen width")
            .setDesc("Set the width of the pen tool for the canvas.")
            .addText((text) =>
                text
                    .setPlaceholder("3")
                    .setValue(String(this.newSettings.chalkboardPenWidth))
                    .onChange((value) => {
                        const numValue = Number(value);
                        if (!Number.isNaN(numValue) && numValue > 0) {
                            this.newSettings.chalkboardPenWidth = numValue;
                        } else {
                            this.newSettings.chalkboardPenWidth = 3; // Default value
                        }
                    }),
            );

        new Setting(containerEl)
            .setName("Chalkboard chalk width")
            .setDesc("Set the width of the chalk tool for the chalkboard.")
            .addText((text) =>
                text
                    .setPlaceholder("7")
                    .setValue(String(this.newSettings.chalkboardChalkWidth))
                    .onChange((value) => {
                        const numValue = Number(value);
                        if (!Number.isNaN(numValue) && numValue > 0) {
                            this.newSettings.chalkboardChalkWidth = numValue;
                        } else {
                            this.newSettings.chalkboardChalkWidth = 7; // Default value
                        }
                    }),
            );

        new Setting(containerEl)
            .setName("Elapsed time bar")
            .setDesc(
                "Display an elapsed time bar; set 'timeForPresentation' property in seconds (500), minutes (55m), or hours (1h).",
            )
            .addButton((btn) => {
                btn.setButtonText("enableTimeBar").setDisabled(true);
            })
            .addToggle((value) =>
                value
                    .setValue(this.newSettings.enableTimeBar)
                    .onChange((value) => {
                        this.newSettings.enableTimeBar = value;
                    }),
            );

        new Setting(containerEl)
            .setName("Laser pointer")
            .setDesc("Change your mouse into a laser pointer (toggle with Q).")
            .addButton((btn) => {
                btn.setButtonText("enablePointer").setDisabled(true);
            })
            .addToggle((value) =>
                value
                    .setValue(this.newSettings.enablePointer)
                    .onChange((value) => {
                        this.newSettings.enablePointer = value;
                    }),
            );

        new Setting(containerEl)
            .setName("Menu")
            .setDesc("Display a presentation menu button.")
            .addButton((btn) => {
                btn.setButtonText("enableMenu").setDisabled(true);
            })
            .addToggle((value) =>
                value
                    .setValue(this.newSettings.enableMenu)
                    .onChange((value) => {
                        this.newSettings.enableMenu = value;
                    }),
            );

        new Setting(containerEl)
            .setName("Overview")
            .setDesc("When enabled, display a presentation overview button.")
            .addButton((btn) => {
                btn.setButtonText("enableOverview").setDisabled(true);
            })
            .addToggle((value) =>
                value
                    .setValue(this.newSettings.enableOverview)
                    .onChange((value) => {
                        this.newSettings.enableOverview = value;
                    }),
            );

        new Setting(containerEl)
            .setName("Progress bar (progress)")
            .setDesc("When enabled, display a presentation progress bar.")
            .addButton((btn) => {
                btn.setButtonText("progress").setDisabled(true);
            })
            .addToggle((value) =>
                value.setValue(this.newSettings.progress).onChange((value) => {
                    this.newSettings.progress = value;
                }),
            );

        new Setting(containerEl)
            .setName("Slide numbers")
            .setDesc("Display the page number of the current slide.")
            .addButton((btn) => {
                btn.setButtonText("slideNumber").setDisabled(true);
            })
            .addToggle((value) =>
                value
                    .setValue(this.newSettings.slideNumber)
                    .onChange((value) => {
                        this.newSettings.slideNumber = value;
                    }),
            );

        new Setting(containerEl)
            .setName("Math engine")
            .setDesc("Select the math rendering engine.")
            .addDropdown((cb) => {
                cb.addOption("katex", "KaTeX")
                    .addOption("mathjax", "MathJax")
                    .setValue(this.newSettings.mathEngine)
                    .onChange((value) => {
                        this.newSettings.mathEngine = value as
                            | "katex"
                            | "mathjax";
                    });
            });
    }
}
