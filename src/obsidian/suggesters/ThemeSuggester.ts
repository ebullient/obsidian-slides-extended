import { FuzzyMatch } from 'obsidian';
import fs from 'fs';
import { ObsidianUtils } from '../obsidianUtils';
import { FuzzyInputSuggest } from 'obsidian-utilities';

const highlightCss = (basename: string): boolean => {
    return basename.contains('highlight') || basename.contains('hljs');
};
const themeCss = (basename: string) => !highlightCss(basename);

const getFiles = (
    directories: string[],
    include: (dir: string, basename: string) => boolean,
) => {
    const result = new Set<string>();

    for (const directory of directories) {
        fs.readdirSync(directory).forEach(file => {
            if (include(directory, file)) {
                result.add(file);
            }
        });
    }
    return result;
};

export const getThemeFiles = (
    utils: ObsidianUtils,
    type: 'highlight' | 'theme',
): string[] => {
    const searchPath =
        type == 'highlight'
            ? utils.getHighlightSearchPath()
            : utils.getThemeSearchPath();

    // ==> hljs or highlight
    return [
        ...getFiles(searchPath, (_: string, basename: string) => {
            if (basename.endsWith('.css')) {
                return type == 'highlight'
                    ? highlightCss(basename)
                    : themeCss(basename);
            }
            return false;
        }),
    ];
};

export class ThemeInputSuggest extends FuzzyInputSuggest<string> {
    getItemText(item: string): string {
        return item;
    }
    renderNote(noteEL: HTMLElement, result: FuzzyMatch<string>): void {
        //no-op
    }
    renderTitle(titleEl: HTMLElement, result: FuzzyMatch<string>): void {
        this.renderMatches(titleEl, result.item, result.match.matches);
    }
}
