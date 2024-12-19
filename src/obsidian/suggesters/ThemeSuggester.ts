import type { FuzzyMatch } from "obsidian";
import fs from "node:fs";
import type { ObsidianUtils } from "../obsidianUtils";
import { FuzzyInputSuggest } from "obsidian-utilities";

const highlightCss = (path: string, basename: string): boolean => {
    return (
        path.contains("highlight") ||
        basename.contains("highlight") ||
        basename.contains("hljs")
    );
};
const themeCss = (path: string, basename: string) =>
    !highlightCss(path, basename);

const getFiles = (
    directories: string[],
    include: (dir: string, basename: string) => boolean,
) => {
    const result = new Set<string>();

    for (const directory of directories) {
        for (const file of fs.readdirSync(directory)) {
            if (include(directory, file)) {
                result.add(file);
            }
        }
    }
    return result;
};

export const getThemeFiles = (
    utils: ObsidianUtils,
    type: "highlight" | "theme",
): string[] => {
    const searchPath =
        type === "highlight"
            ? utils.getHighlightSearchPath()
            : utils.getThemeSearchPath();

    // ==> hljs or highlight
    return [
        ...getFiles(searchPath, (path: string, basename: string) => {
            if (basename.endsWith(".css")) {
                return type === "highlight"
                    ? highlightCss(path, basename)
                    : themeCss(path, basename);
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
