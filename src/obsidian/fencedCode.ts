import type { Options } from "../@types";

export type FenceRange = {
    end: number;
    start: number;
};

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getFenceRanges(markdown: string): FenceRange[] {
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
                    // line ending may lead the following slide separator.
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

export function overlapsFence(
    match: RegExpExecArray,
    fenceRanges: FenceRange[],
): boolean {
    const matchEnd = match.index + match[0].length;
    return fenceRanges.some(
        ({ start, end }) => match.index < end && matchEnd > start,
    );
}

/**
 * Temporarily replace separator text inside fences while Slides Extended runs
 * processors that split the raw note into slides. Line endings remain intact
 * so the fenced block retains its original Markdown structure.
 */
export function protectFencedSeparators(
    markdown: string,
    options: Pick<Options, "separator" | "verticalSeparator">,
): {
    markdown: string;
    restore: (processed: string) => string;
} {
    const separatorRegex = new RegExp(
        `${options.separator}${
            options.verticalSeparator ? `|${options.verticalSeparator}` : ""
        }`,
        "gm",
    );
    const fenceRanges = getFenceRanges(markdown);
    const replacements = new Map<string, string>();
    let nextToken = 0;
    let lastIndex = 0;
    let protectedMarkdown = "";

    const createToken = () => {
        let token: string;
        do {
            token = `\uE000slides-extended-separator-${nextToken++}\uE001`;
        } while (markdown.includes(token));
        return token;
    };

    for (const match of markdown.matchAll(separatorRegex)) {
        if (!overlapsFence(match, fenceRanges)) {
            continue;
        }

        protectedMarkdown += markdown.substring(lastIndex, match.index);
        protectedMarkdown += match[0].replace(/[^\r\n]+/g, (segment) => {
            const token = createToken();
            replacements.set(token, segment);
            return token;
        });
        lastIndex = match.index + match[0].length;
    }

    if (replacements.size === 0) {
        return { markdown, restore: (processed) => processed };
    }

    protectedMarkdown += markdown.substring(lastIndex);
    return {
        markdown: protectedMarkdown,
        restore: (processed) => {
            let restored = processed;
            for (const [token, separator] of replacements) {
                restored = restored.replaceAll(token, separator);
            }
            return restored;
        },
    };
}
