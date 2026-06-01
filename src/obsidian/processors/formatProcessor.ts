// Process formatting
// See docs/content/basic-syntax/textStyle.md

import type { Options, Processor } from "../../@types";
import { processBySlide, skipMathCodeBlocks } from "../obsidianUtils";

export class FormatProcessor implements Processor {
    private highlightedRegex = /==([\s\S]*?)==/g;
    private commentRegex = /%%([\s\S]*?)%%/g;

    process(markdown: string, options?: Options) {
        let output = markdown;
        if (options) {
            processBySlide(markdown, options, (slide) => {
                let newSlide = slide;
                newSlide = skipMathCodeBlocks(slide, (md) =>
                    this.formatText(md),
                );
                output = output.replace(slide, () => newSlide);
                return newSlide;
            });
        }
        return output;
    }

    private formatText(markdown: string): string {
        return markdown
            .replaceAll(this.highlightedRegex, "<mark>$1</mark>")
            .replaceAll(this.commentRegex, "");
    }
}
