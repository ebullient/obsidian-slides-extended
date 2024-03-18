// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes
import { App } from 'obsidian';
import fs from 'fs';
import { TextInputSuggest } from './Suggest';
import { ObsidianUtils } from '../obsidianUtils';

const highlightCss = (basename: string): boolean => {
    return basename.contains('highlight') || basename.contains('hljs');
};
const themeCss = (basename: string) => !highlightCss(basename);

export class ThemeSuggest extends TextInputSuggest<string> {
    readonly utils: ObsidianUtils;
    readonly themeFiles: string[];
    constructor(
        type: string,
        app: App,
        inputEl: HTMLInputElement | HTMLTextAreaElement,
        utils: ObsidianUtils,
    ) {
        super(app, inputEl);
        this.utils = utils;

        const searchPath =
            type == 'highlight'
                ? this.utils.getHighlightSearchPath()
                : this.utils.getThemeSearchPath();

        // ==> hljs or highlight
        this.themeFiles = Array.of(
            ...this.getFiles(searchPath, (_: string, basename: string) => {
                if (basename.endsWith('.css')) {
                    return type == 'highlight'
                        ? highlightCss(basename)
                        : themeCss(basename);
                }
                return false;
            }),
        );
    }

    getSuggestions(inputStr: string): string[] {
        const files: string[] = [];
        const lowerCaseInputStr = inputStr.toLowerCase();
        this.themeFiles.forEach((file: string) => {
            if (file.toLowerCase().includes(lowerCaseInputStr)) {
                files.push(file);
            }
        });
        return files;
    }

    getFiles(
        directories: string[],
        include: (dir: string, basename: string) => boolean,
    ) {
        const result = new Set<string>();

        for (const directory of directories) {
            fs.readdirSync(directory).forEach(file => {
                if (include(directory, file)) {
                    result.add(file);
                }
            });
        }
        return result;
    }

    renderSuggestion(file: string, el: HTMLElement): void {
        el.setText(file);
    }

    selectSuggestion(file: string): void {
        this.inputEl.value = file;
        this.inputEl.trigger('input');
        this.close();
    }
}
