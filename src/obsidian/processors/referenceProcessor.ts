import type { Options, Processor } from "src/@types";
import { processBySlide, skipMathCodeBlocks } from "../obsidianUtils";

export class ReferenceProcessor implements Processor {
    private refRegex = /\^[\w-]+\s/g;

    process(markdown: string, options: Options) {
        let output = markdown;
        processBySlide(markdown, options, (slide) => {
            let newSlide = slide;
            newSlide = skipMathCodeBlocks(slide, (md) =>
                this.removeBlockRef(md),
            );
            output = output.replace(slide, () => newSlide);
            return newSlide;
        });
        return output;
    }
    removeBlockRef(md: string): string {
        return md.replaceAll(this.refRegex, "");
    }
}
