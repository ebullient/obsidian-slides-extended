import type { Options, Processor } from "src/@types";
import { processBySlide } from "../obsidianUtils";

export class LatexProcessor implements Processor {
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

        // Replace code blocks with placeholders
        let result = markdown.replace(codeBlockRegex, (match) => {
            const placeholder = `~~CODE~BLOCK~${codeBlocks.length}~~`;
            codeBlocks.push(match);
            return placeholder;
        });

        // Replace inline code with placeholders
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

        // Helper to process content inside math delimiters
        const processMathContent = (content: string) => {
            return this.withProtectedVerbSegments(content, (c) => {
                // 1. Double backslashes to survive markdown processing
                c = this.doubleBackslashes(c);
                // 2. Escape unescaped underscores
                c = this.escapeUnescapedUnderscores(c);
                // 3. Protect runs of escaped underscores
                c = this.protectEscapedUnderscoreRuns(c);
                // 4. Escape markdown specials (*, ~)
                c = this.escapeMarkdownSpecialCharacters(c);
                return c;
            });
        };

        // Handle display math $$...$$
        processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_, content) => {
            const fixedContent = content.replace(/\n\s*/g, " ");
            return `%\`%$$${processMathContent(fixedContent)}$$%\`%`;
        });

        // Add a marker for already processed content
        const markedProcessed = processed.replace(/%`%(.*?)%`%/g, (match) => {
            return `~~PROTECTED_MATH~~${encodeURIComponent(match)}~~END_PROTECTED~~`;
        });

        // Handle inline math $...$
        const inlineProcessed = markedProcessed.replace(
            /\$([^$]+?)\$/g,
            (_match, content) => {
                return `%\`%$${processMathContent(content)}$%\`%`;
            },
        );

        // Restore protected content
        processed = inlineProcessed.replace(
            /~~PROTECTED_MATH~~(.*?)~~END_PROTECTED~~/g,
            (_, encoded) => decodeURIComponent(encoded),
        );

        return processed.replaceAll("~~ESCAPED_DOLLAR~~", "\\$");
    }

    /**
     * Doubles backslashes in math content to ensure they survive reveal.js markdown processing.
     * Simple global replace: \ -> \\
     */
    private doubleBackslashes(content: string): string {
        return content.replace(/\\/g, "\\\\");
    }

    /**
     * Protect `\verb` segments inside math from any transformations.
     */
    private withProtectedVerbSegments(
        content: string,
        transform: (content: string) => string,
    ): string {
        const verbRegex = /\\verb\*?([^A-Za-z0-9\s])([\s\S]*?)\1/g;
        const segments: string[] = [];
        const placeholderPrefix = "LATEXVERB";
        const placeholderSuffix = "END";

        // Replace verb segments with placeholders
        let replaced = content.replace(verbRegex, (match) => {
            const placeholder = `${placeholderPrefix}${segments.length}${placeholderSuffix}`;
            segments.push(match);
            return placeholder;
        });

        // Apply transformation to the rest
        replaced = transform(replaced);

        // Restore verb segments, escaping underscores inside them
        return replaced.replace(
            new RegExp(`${placeholderPrefix}(\\d+)${placeholderSuffix}`, "g"),
            (_, index) => {
                const verbSegment = segments[Number.parseInt(index, 10)];
                // Escape underscores inside the verbatim content: _ -> \_
                // so reveal.js markdown doesn't interpret them as emphasis
                return verbSegment.replace(
                    /(\\verb\*?)([^A-Za-z0-9\s])([\s\S]*?)(\2)/g,
                    (_, cmd, delim, inner, endDelim) => {
                        return `${cmd}${delim}${inner.replace(
                            /_/g,
                            "\\_",
                        )}${endDelim}`;
                    },
                );
            },
        );
    }

    /**
     * Triples backslashes for escaped underscore runs to survive markdown parsing.
     * After doubleBackslashes, `_` -> `\_` -> `\\_`.
     * We want `\\_` -> `\\\_` so that after markdown consumes one backslash, we have `\_`.
     */
    private protectEscapedUnderscoreRuns(content: string): string {
        return content.replace(/\\\\_/g, "\\\\\\_");
    }

    /**
     * Escapes unescaped underscores: `_` -> `\_`.
     * Uses negative lookbehind to ensure `_` is not already preceded by `\`.
     * Note: We check against the original single backslash because we are conceptually
     * fixing the "source" before the doubling step, but since we call this AFTER
     * doubleBackslashes, we actually need to check for `\\` (doubled backslash).
     *
     * WAIT: The previous logic was:
     * 1. doubleBackslashes: \ -> \\
     * 2. escapeUnescapedUnderscores: _ -> \_ (if not preceded by \)
     *
     * If input is `\_`, doubleBackslashes makes it `\\_`.
     * If we look for `_` not preceded by `\\`, `\\_` HAS a preceding `\\`. So it matches `(?<!\\\\)_`.
     *
     * Let's re-verify the order in `processMathContent`:
     * 1. doubleBackslashes(c) -> All `\` become `\\`.
     * 2. escapeUnescapedUnderscores(c).
     *
     * Case A: `x_i` (Input) -> `x_i` (After Step 1) -> `x\_i` (We want this).
     * Case B: `x\_i` (Input) -> `x\\_i` (After Step 1).
     *    In `x\\_i`, the `_` is preceded by `\\`.
     *    We do NOT want to escape this `_`.
     *    So we need negative lookbehind `(?<!\\\\)`.
     */
    private escapeUnescapedUnderscores(content: string): string {
        // Matches `_` strictly NOT preceded by `\\` (which represents a literal backslash after doubling).
        return content.replace(/(?<!\\\\)_/g, "\\_");
    }

    private escapeMarkdownSpecialCharacters(content: string): string {
        // Escape * and ~ if they are not already escaped.
        // After doubleBackslashes, escaped chars look like `\\*`.
        // Unescaped chars look like `*`.
        return content.replace(/(?<!\\\\)([*~])/g, (match) => {
            return match === "*" ? "&#42;" : "&#126;";
        });
    }
}
