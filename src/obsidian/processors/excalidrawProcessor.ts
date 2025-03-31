import { Notice } from "obsidian";
import type { Processor } from "src/@types";
import type { ObsidianUtils } from "../obsidianUtils";

export class ExcalidrawProcessor implements Processor {
    private excalidrawImageRegex =
        /!\[\[(.*\.excalidraw)\|?([^\]]*)??\]\]\s?(<!--.*-->)?/i;

    private utils: ObsidianUtils;

    constructor(utils: ObsidianUtils) {
        this.utils = utils;
    }

    process(markdown: string) {
        return markdown
            .split("\n")
            .map((line) => {
                if (this.excalidrawImageRegex.test(line))
                    return this.transformLine(line);
                return line;
            })
            .join("\n");
    }

    private transformLine(line: string) {
        const [, image, ext, comment] = this.excalidrawImageRegex.exec(line);
        const imgFile = this.utils.findMediaFile(image);

        if (imgFile === null) {
            new Notice(
                `Cannot find Image for ${image}. Make sure to activate Auto-export SVG/PNG in Excalidraw Settings.`,
                8000,
            );
            return line;
        }
        return `![[${imgFile}${ext === undefined ? "" : `|${ext}`}]] ${comment ?? ""}`;
    }
}
