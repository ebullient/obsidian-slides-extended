import type { Options, Processor } from "src/@types";
import { processBySlide } from "../obsidianUtils";

export class LatexProcessor implements Processor {
    private singleLine = /\$(.*?)\$/g;
    private TWO_BACKSLASHES = /\\\\/g;
    private THREE_BACKSLASHES = "\\\\\\";

    process(markdown: string, options: Options) {
        let output = markdown;
        processBySlide(markdown, options, (slide) => {
            let newSlide = slide;
            if (slide.includes("$")) {
                newSlide = this.skipCodeBlocks(slide);
                output = output.replace(slide, () => newSlide);
            }
            return newSlide;
        });

        return output;
    }

    skipCodeBlocks(markdown: string): string {
        if (!markdown.includes("$")) {
            return markdown;
        }

        const regex =
            /(?<=(^|\r|\n|\r\n))\s*`{3,}.*?(\r|\n|\r\n)[\s\S]*?(\r|\n|\r\n)`{3,}(?=($|\r|\n|\r\n))/;

        const codeBlocks: string[] = [];
        let result = markdown.replace(regex, (match) => {
            const placeholder = `CODE_BLOCK_PLACEHOLDER_${codeBlocks.length}`;
            codeBlocks.push(match);
            return placeholder;
        });

        // Process LaTeX in the non-code-block text
        result = this.transformLatex(result);

        // Restore code blocks
        codeBlocks.forEach((block, index) => {
            result = result.replace(`CODE_BLOCK_PLACEHOLDER_${index}`, block);
        });

        return result;
    }

    private transformLatex(markdown: string) {
        // First, protect escaped $ characters
        let processed = markdown.replaceAll("\\$", "~~ESCAPED_DOLLAR~~");

        // Note: we are wrapping backticks (%`%):
        // 1. having paired backticks will still match general regular expressions
        //    that avoid inline code.
        // 2. the formatProcessor, in particular, can skip math expressions entirely
        //    when matching underscores.

        // First handle display math
        processed = processed.replace(
            /\$\$([\s\S]*?)\$\$/g,
            (match, content) => {
                const fixedContent = content
                    .replace(/\n\s*/g, "")
                    .replace(/_/g, "\\_")
                    .replace(this.TWO_BACKSLASHES, this.THREE_BACKSLASHES);
                return `%\`%$$${fixedContent}$$%\`%`;
            },
        );

        // Then handle inline math: avoid matching within already processed content
        processed = processed.replace(
            /([^`]|^)\$(.*?[^\\])\$(?!`)/g,
            (match, before, content) => {
                return `${before}%\`%$${content.replace(/_/g, "\\_")}$%\`%`;
            },
        );

        // Handle inline math
        processed = processed.replace(this.singleLine, "%`%$$$1$$%`%");

        // Restore escaped dollars
        return processed.replaceAll("~~ESCAPED_DOLLAR~~", "\\$");
    }
}
