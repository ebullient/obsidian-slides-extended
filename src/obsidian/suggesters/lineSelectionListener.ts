import {
    type App,
    type Editor,
    type EditorPosition,
    EditorSuggest,
    type EditorSuggestContext,
    type EditorSuggestTriggerInfo,
    type TFile,
} from "obsidian";
import type { SlidesExtendedPlugin } from "../../slidesExtended-Plugin";

export class LineSelectionListener extends EditorSuggest<string> {
    private plugin: SlidesExtendedPlugin;

    constructor(app: App, plugin: SlidesExtendedPlugin) {
        super(app);
        this.plugin = plugin;
    }

    onTrigger(
        cursor: EditorPosition,
        _editor: Editor,
        _file: TFile,
    ): EditorSuggestTriggerInfo {
        const instance = this.plugin.getViewInstance();

        if (instance) {
            if (instance.url === "about:blank") {
                this.plugin.showView();
            }
            instance.onLineChanged(cursor.line);
        }
        return null;
    }

    getSuggestions(
        _context: EditorSuggestContext,
    ): string[] | Promise<string[]> {
        throw new Error("Method not implemented.");
    }

    renderSuggestion(_value: string, _el: HTMLElement): void {
        throw new Error("Method not implemented.");
    }

    selectSuggestion(_value: string, _evt: MouseEvent | KeyboardEvent): void {
        throw new Error("Method not implemented.");
    }
}
