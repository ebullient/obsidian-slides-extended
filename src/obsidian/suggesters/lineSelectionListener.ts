import {
    App,
    Editor,
    EditorPosition,
    EditorSuggest,
    EditorSuggestContext,
    EditorSuggestTriggerInfo,
    TFile,
} from 'obsidian';
import { AdvancedSlidesPlugin } from '../../advancedSlides-Plugin';

export class LineSelectionListener extends EditorSuggest<string> {
    private plugin: AdvancedSlidesPlugin;

    constructor(app: App, plugin: AdvancedSlidesPlugin) {
        super(app);
        this.plugin = plugin;
    }

    onTrigger(
        cursor: EditorPosition,
        editor: Editor,
        file: TFile,
    ): EditorSuggestTriggerInfo {
        const instance = this.plugin.getViewInstance();

        if (instance) {
            if (instance.url == 'about:blank') {
                this.plugin.showView();
            }
            instance.onLineChanged(cursor.line);
        }
        return null;
    }

    getSuggestions(
        context: EditorSuggestContext,
    ): string[] | Promise<string[]> {
        throw new Error('Method not implemented.');
    }

    renderSuggestion(value: string, el: HTMLElement): void {
        throw new Error('Method not implemented.');
    }

    selectSuggestion(value: string, evt: MouseEvent | KeyboardEvent): void {
        throw new Error('Method not implemented.');
    }
}
