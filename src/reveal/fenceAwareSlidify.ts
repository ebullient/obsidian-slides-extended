import type { Options } from "../@types";
import { getFenceRanges, overlapsFence } from "../obsidian/fencedCode";

type SlideGroup = string | string[];

type Slidify = (markdown: string, options: Partial<Options>) => string;

export const INERT_SEPARATOR = "(?!)";

function getSeparatorMatches(
    markdown: string,
    options: Pick<Options, "separator" | "verticalSeparator">,
): RegExpExecArray[] {
    const separatorRegex = new RegExp(
        `${options.separator}${
            options.verticalSeparator ? `|${options.verticalSeparator}` : ""
        }`,
        "gm",
    );
    const fenceRanges = getFenceRanges(markdown);
    const matches: RegExpExecArray[] = [];
    for (const match of markdown.matchAll(separatorRegex)) {
        if (!overlapsFence(match, fenceRanges)) {
            matches.push(match);
        }
    }

    return matches;
}

/**
 * Split Markdown using reveal.js semantics while ignoring separators inside
 * fenced code blocks. Individual slides are still rendered by reveal.js so
 * notes and script-end escaping retain their upstream behavior.
 */
export function fenceAwareSlidify(
    markdown: string,
    options: Pick<
        Options,
        "notesSeparator" | "separator" | "verticalSeparator"
    >,
    slidify: Slidify,
): string {
    const horizontalSeparatorRegex = new RegExp(options.separator);
    const sectionStack: SlideGroup[] = [];
    let lastIndex = 0;
    let wasHorizontal = true;

    for (const match of getSeparatorMatches(markdown, options)) {
        const isHorizontal = horizontalSeparatorRegex.test(match[0]);

        if (!isHorizontal && wasHorizontal) {
            sectionStack.push([]);
        }

        const content = markdown.substring(lastIndex, match.index);
        if (isHorizontal && wasHorizontal) {
            sectionStack.push(content);
        } else {
            (sectionStack[sectionStack.length - 1] as string[]).push(content);
        }

        lastIndex = match.index + match[0].length;
        wasHorizontal = isHorizontal;
    }

    const remaining = markdown.substring(lastIndex);
    if (wasHorizontal) {
        sectionStack.push(remaining);
    } else {
        (sectionStack[sectionStack.length - 1] as string[]).push(remaining);
    }

    const renderSlide = (content: string) =>
        slidify(content, {
            notesSeparator: options.notesSeparator,
            separator: INERT_SEPARATOR,
            verticalSeparator: INERT_SEPARATOR,
        });

    return sectionStack
        .map((group) => {
            if (Array.isArray(group)) {
                return `<section >${group.map(renderSlide).join("")}</section>`;
            }
            return renderSlide(group);
        })
        .join("");
}

/**
 * reveal.js processes every data-markdown section again in the browser. At
 * that point Slides Extended has already split the presentation, so all slide
 * and notes separators must be disabled to keep verbatim content inert.
 */
export function preventBrowserResplitting(slides: string): string {
    const attributes = [
        `data-separator="${INERT_SEPARATOR}"`,
        `data-separator-vertical="${INERT_SEPARATOR}"`,
        `data-separator-notes="${INERT_SEPARATOR}"`,
    ].join(" ");

    return slides.replace(
        /<section\s+data-markdown>/g,
        `<section ${attributes} data-markdown>`,
    );
}
