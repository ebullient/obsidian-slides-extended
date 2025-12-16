import type { Options, Processor } from "src/@types";
import { processBySlide, skipMathCodeBlocks } from "../obsidianUtils";

export class FormatProcessor implements Processor {
    private boldRegex = /(?<=[^_]|^)__([^_]+)__(?!_)/gm;
    private markRegex = /==([^=]*)==/gm;
    private commentRegex = /%%([^%]*)%%/gm;

    process(markdown: string, options: Options) {
        let output = markdown;
        processBySlide(markdown, options, (slide) => {
            let newSlide = slide;
            newSlide = skipMathCodeBlocks(slide, (md) => this.formatText(md));
            output = output.replace(slide, () => newSlide);
            return newSlide;
        });
        return output;
    }

    private formatText(markdown: string): string {
        return markdown
            .replaceAll(this.boldRegex, (_, args) => `**${args.trim()}**`)
            .replaceAll(this.markRegex, "<mark>$1</mark>")
            .replaceAll(this.commentRegex, "")
            .replaceAll("\n", "  \n");
    }
}
