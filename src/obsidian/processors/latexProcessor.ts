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

        const codeBlockRegex =
            /^(\s*)(`{3,})(.*?)[\r\n][\s\S]*?(?:\r|\n|\r\n)\s*\2(?=$|[\r\n])/gm;
        const inlineCodeRegex = /`[^`\n]+?`/g;

        const codeBlocks: string[] = [];
        const inlineCodeBlocks: string[] = [];
        let result = markdown.replace(codeBlockRegex, (match) => {
            const placeholder = `~~CODE~BLOCK~${codeBlocks.length}~~`;
            codeBlocks.push(match);
            return placeholder;
        });
        result = result.replace(inlineCodeRegex, (match) => {
            const placeholder = `~~INLINE~BLOCK~${inlineCodeBlocks.length}~~`;
            inlineCodeBlocks.push(match);
            return placeholder;
        });

        // Process LaTeX in the non-code-block text
        result = this.transformLatex(result);

        // Restore code blocks
        for (let i = 0; i < codeBlocks.length; i++) {
            const placeholder = `~~CODE~BLOCK~${i}~~`;
            result = result.replace(placeholder, () => codeBlocks[i]);
        }
        for (let i = 0; i < inlineCodeBlocks.length; i++) {
            const placeholder = `~~INLINE~BLOCK~${i}~~`;
            result = result.replace(placeholder, () => inlineCodeBlocks[i]);
        }

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
        processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_, content) => {
            const fixedContent = content
                .replace(/\n\s*/g, "")
                .replace(this.TWO_BACKSLASHES, this.THREE_BACKSLASHES);
            return `%\`%$$${fixedContent}$$%\`%`;
        });

        // Add a marker for already processed content to prevent further matching
        const markedProcessed = processed.replace(/%`%(.*?)%`%/g, (match) => {
            return `~~PROTECTED_MATH~~${encodeURIComponent(match)}~~END_PROTECTED~~`;
        });

        // Then handle inline math after protecting already processed content
        const inlineProcessed = markedProcessed.replace(
            /\$([^$]+?)\$/g,
            (_match, content) => {
                const fixedContent = content.replace(/_/g, "\\_");
                return `%\`%$${fixedContent}$%\`%`;
            },
        );

        // Restore the protected content
        processed = inlineProcessed.replace(
            /~~PROTECTED_MATH~~(.*?)~~END_PROTECTED~~/g,
            (_, encoded) => {
                return decodeURIComponent(encoded);
            },
        );

        return processed.replaceAll("~~ESCAPED_DOLLAR~~", "\\$");
    }
}
