import type { Options } from "../@types";

type FenceRange = {
    end: number;
    start: number;
};

type SlideGroup = string | string[];

type Slidify = (markdown: string, options: Partial<Options>) => string;

export const INERT_SEPARATOR = "(?!)";

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getFenceRanges(markdown: string): FenceRange[] {
    const ranges: FenceRange[] = [];
    const lineRegex = /[^\r\n]*(?:\r\n|\r|\n|$)/g;
    let activeFence:
        | {
              character: string;
              length: number;
              start: number;
          }
        | undefined;
    for (const lineMatch of markdown.matchAll(lineRegex)) {
        if (lineMatch[0] === "") {
            break;
        }

        const line = lineMatch[0].replace(/(?:\r\n|\r|\n)$/, "");

        if (activeFence) {
            const closingFence = new RegExp(
                `^ {0,3}${escapeRegex(activeFence.character)}{${
                    activeFence.length
                },}[\\t ]*$`,
            );

            if (closingFence.test(line)) {
                ranges.push({
                    start: activeFence.start,
                    // The closing fence belongs to the protected range, but its
                    // line ending may be the leading newline of the following
                    // slide separator.
                    end: lineMatch.index + line.length,
                });
                activeFence = undefined;
            }
            continue;
        }

        const openingFence = /^(?: {0,3})(`{3,}|~{3,})(.*)$/.exec(line);
        if (!openingFence) {
            continue;
        }

        const marker = openingFence[1];
        const infoString = openingFence[2];
        if (marker.startsWith("`") && infoString.includes("`")) {
            continue;
        }

        activeFence = {
            character: marker[0],
            length: marker.length,
            start: lineMatch.index,
        };
    }

    if (activeFence) {
        ranges.push({ start: activeFence.start, end: markdown.length });
    }

    return ranges;
}

function overlapsFence(
    match: RegExpExecArray,
    fenceRanges: FenceRange[],
): boolean {
    const matchEnd = match.index + match[0].length;
    return fenceRanges.some(
        ({ start, end }) => match.index < end && matchEnd > start,
    );
}

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
