import type { Options } from "../../@types";
import { md } from "../../reveal/markdown";
import { CommentParser } from "../comment";
import { protectFencedCode } from "../fencedCode";

type SlideVariables = Record<string, string | undefined>;

export type Slide = {
    markdown: string;
    horizontal: number;
    vertical: number;
    hasVertical: boolean;
    variables: SlideVariables;
};

export type SlideDeck = {
    groups: SlideGroup[];
    horizontalSeparators: string[];
};

export type SlideGroup = {
    slides: Slide[];
    verticalSeparators: string[];
};

export interface SlideDeckProcessor {
    process(deck: SlideDeck, options: Options): void;
}

class SlideNumberProcessor implements SlideDeckProcessor {
    process(deck: SlideDeck, options: Options): void {
        const slides = deck.groups.flatMap((group) => group.slides);
        const total = String(slides.length);
        const format = (options.slideNumberFormat as string) || "c";

        for (let index = 0; index < slides.length; index++) {
            const slide = slides[index];
            const count = index + 1;
            const vertical = slide.hasVertical ? slide.vertical : 0;
            const slideNumber = this.format(
                format,
                slide.horizontal,
                vertical,
                count,
                slides.length,
                slide.hasVertical,
            );

            Object.assign(slide.variables, {
                slideNumber,
                slidesTotal: total,
                slideNumberH: String(slide.horizontal),
                slideNumberV: String(vertical),
                slideNumberC: String(count),
                slideNumberT: total,
                "--slide-number": String(count),
                "--slides-total": total,
                "--slide-number-h": String(slide.horizontal),
                "--slide-number-v": String(vertical),
                "--slide-number-c": String(count),
                "--slide-number-t": total,
            });
        }
    }

    private format(
        format: string,
        horizontal: number,
        vertical: number,
        count: number,
        total: number,
        hasVertical: boolean,
    ): string {
        switch (format) {
            case "c":
                return String(count);
            case "c/t":
                return `${count}/${total}`;
            case "h.v":
                return hasVertical
                    ? `${horizontal}.${vertical}`
                    : String(horizontal);
            case "h/v":
                return hasVertical
                    ? `${horizontal}/${vertical}`
                    : String(horizontal);
            default:
                return format
                    .replace(/\bc\b/g, String(count))
                    .replace(/\bt\b/g, String(total))
                    .replace(/\bh\b/g, String(horizontal))
                    .replace(/\bv\b/g, String(vertical));
        }
    }
}

class HeadingContextProcessor implements SlideDeckProcessor {
    private headingRegex = /^(#{1,6})[ \t]+(.+?)(?:[ \t]+#+[ \t]*)?$/gm;

    process(deck: SlideDeck): void {
        const headings: Array<string | undefined> = Array(6).fill(undefined);

        for (const slide of deck.groups.flatMap((group) => group.slides)) {
            this.headingRegex.lastIndex = 0;
            const markdown = protectFencedCode(slide.markdown);
            for (
                let match = this.headingRegex.exec(markdown);
                match !== null;
                match = this.headingRegex.exec(markdown)
            ) {
                const level = match[1].length;
                headings[level - 1] = md.marked.parseInline(match[2].trim());
                headings.fill(undefined, level);
            }

            for (let level = 1; level <= 6; level++) {
                const heading = headings[level - 1] ?? "";
                slide.variables[`h${level}`] = heading;
                slide.variables[`--h${level}`] = cssString(
                    inlineHtmlToText(heading),
                );
            }
        }
    }
}

export class SlidePostProcessor {
    private commentParser = new CommentParser();
    private slideCommentRegex = /<!--\s*(?:\.)?slide.*?-->/s;
    private variableRegex = /<%\??(.*?)%>/g;
    private optionalRegex = /<%\?\s*(.*?)\s*%>/g;

    constructor(
        private processors: SlideDeckProcessor[] = [
            new SlideNumberProcessor(),
            new HeadingContextProcessor(),
        ],
    ) {}

    process(markdown: string, options: Options): string {
        const deck = this.parse(markdown, options);
        for (const processor of this.processors) {
            processor.process(deck, options);
        }
        return this.serialize(deck);
    }

    private parse(markdown: string, options: Options): SlideDeck {
        const horizontal = splitMarkdown(markdown, options.separator);
        const groups = horizontal.parts.map((group, groupIndex) => {
            const vertical = splitMarkdown(group, options.verticalSeparator);
            const hasVertical = vertical.parts.length > 1;
            return {
                slides: vertical.parts.map((slide, slideIndex) => ({
                    markdown: slide,
                    horizontal: groupIndex + 1,
                    vertical: slideIndex + 1,
                    hasVertical,
                    variables: {},
                })),
                verticalSeparators: vertical.separators,
            };
        });
        return { groups, horizontalSeparators: horizontal.separators };
    }

    private serialize(deck: SlideDeck): string {
        return joinMarkdown(
            deck.groups.map((group) =>
                joinMarkdown(
                    group.slides.map((slide) => this.serializeSlide(slide)),
                    group.verticalSeparators,
                ),
            ),
            deck.horizontalSeparators,
        );
    }

    private serializeSlide(slide: Slide): string {
        let markdown = this.replaceVariables(slide.markdown, slide.variables);
        markdown = this.addCssVariables(markdown, slide.variables);
        return markdown;
    }

    private replaceVariables(
        markdown: string,
        variables: SlideVariables,
    ): string {
        this.variableRegex.lastIndex = 0;
        const result = markdown.replace(this.variableRegex, (match, rawKey) => {
            const key = rawKey.trim();
            return variables[key] ?? match;
        });

        this.optionalRegex.lastIndex = 0;
        return result.replace(this.optionalRegex, (match, rawKey) => {
            const key = rawKey.trim();
            return key in variables && !variables[key] ? "" : match;
        });
    }

    private addCssVariables(
        markdown: string,
        variables: SlideVariables,
    ): string {
        const cssVariables = Object.entries(variables).filter(([key]) =>
            key.startsWith("--"),
        );
        const existingComment = markdown.match(this.slideCommentRegex)?.[0];
        const comment = existingComment
            ? this.commentParser.parseLine(existingComment)
            : this.commentParser.buildComment("slide");

        for (const [key, value] of cssVariables) {
            comment.addStyle(key, value ?? "");
        }

        const annotation = this.commentParser.commentToString(comment);
        return existingComment
            ? markdown.replace(existingComment, annotation)
            : `${annotation}\n${markdown}`;
    }
}

function inlineHtmlToText(value: string): string {
    return value
        .replace(/<[^>]*>/g, "")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&#(\d+);/g, (_, value: string) =>
            String.fromCodePoint(Number(value)),
        )
        .replace(/&#x([a-f\d]+);/gi, (_, value: string) =>
            String.fromCodePoint(Number.parseInt(value, 16)),
        );
}

function cssString(value: string): string {
    const escaped = value
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/\r/g, "\\A ")
        .replace(/\n/g, "\\A ")
        .replace(/:/g, "\\3A ")
        .replace(/;/g, "\\3B ");
    return `'${escaped}'`;
}

function splitMarkdown(
    markdown: string,
    separator: string,
): { parts: string[]; separators: string[] } {
    const regex = new RegExp(separator, "gmi");
    const parts: string[] = [];
    const separators: string[] = [];
    let cursor = 0;

    for (
        let match = regex.exec(markdown);
        match !== null;
        match = regex.exec(markdown)
    ) {
        parts.push(markdown.slice(cursor, match.index));
        separators.push(match[0]);
        cursor = regex.lastIndex;
    }
    parts.push(markdown.slice(cursor));
    return { parts, separators };
}

function joinMarkdown(parts: string[], separators: string[]): string {
    return parts.reduce(
        (markdown, part, index) =>
            index === 0 ? part : `${markdown}${separators[index - 1]}${part}`,
        "",
    );
}
