// No backtick/tilde/dash, so a placeholder can never be re-matched as a
// fence or slide separator on a later protect pass.
const PLACEHOLDER_PREFIX = "FENCEDCODE";
const PLACEHOLDER_SUFFIX = "ECODDECNEF";
// ":" is in neither the type alphabet nor base64, so it unambiguously
// separates the fence's type from its payload, in plain text, so type-aware
// consumers (Mermaid/Chart, future admonition processors) can match their
// own fences without decoding every placeholder.
const TYPE_SEPARATOR = ":";
const PLACEHOLDER_REGEX = new RegExp(
    `${PLACEHOLDER_PREFIX}([^:]*)${TYPE_SEPARATOR}([01])${TYPE_SEPARATOR}([A-Za-z0-9+/=]*)${PLACEHOLDER_SUFFIX}`,
    "g",
);

const OPENING_FENCE_REGEX =
    /^([ \t]*)(`{3,}|~{3,})([^\r\n]*)(?:\r\n|\r|\n|$)/gm;

export type FencedBlock = {
    /** Info string's first word, lowercased; empty if none. */
    type: string;
    /** Opening marker/info string, content, and closing marker — no surrounding indent or trailing line terminator. Always closed; transformFencedCodeByType never hands an unclosed fence to a consumer. */
    fenceText: string;
};

/**
 * Replace every fenced code block with a self-decoding placeholder tagged
 * with its type. Safe to call repeatedly: a placeholder has no backtick/tilde
 * runs, so it can't be re-matched as a new fence.
 */
export function protectFencedCode(markdown: string): string {
    let result = "";
    let cursor = 0;

    OPENING_FENCE_REGEX.lastIndex = 0;

    for (
        let match = OPENING_FENCE_REGEX.exec(markdown);
        match !== null;
        match = OPENING_FENCE_REGEX.exec(markdown)
    ) {
        if (match.index < cursor) {
            continue;
        }

        const [openingLine, indent, fenceChar, infoString] = match;
        const fenceStart = match.index;
        const contentStart = fenceStart + openingLine.length;
        // Indent and the trailing line terminator (below) stay outside the
        // placeholder so surrounding .trim()-based processors still see and
        // normalize them as they would for an unprotected fence.
        const payloadStart = fenceStart + indent.length;

        const closingRegex = new RegExp(
            `^${escapeRegExp(indent)}${fenceChar[0]}{${fenceChar.length},}[ \\t]*(?:\\r\\n|\\r|\\n|$)`,
            "gm",
        );
        closingRegex.lastIndex = contentStart;

        const closingMatch = closingRegex.exec(markdown);
        const fenceEnd = closingMatch
            ? closingMatch.index + closingMatch[0].length
            : markdown.length;
        const trailingTerminatorMatch = /\r\n|\r|\n$/.exec(
            markdown.slice(payloadStart, fenceEnd),
        );
        const closingMarkerEnd = trailingTerminatorMatch
            ? fenceEnd - trailingTerminatorMatch[0].length
            : fenceEnd;

        result += markdown.slice(cursor, payloadStart);
        const fenceText = markdown.slice(payloadStart, closingMarkerEnd);
        const type = infoString.trim().split(/\s+/)[0].toLowerCase();
        result += makePlaceholder(type, Boolean(closingMatch), fenceText);
        result += markdown.slice(closingMarkerEnd, fenceEnd);

        cursor = fenceEnd;
        OPENING_FENCE_REGEX.lastIndex = cursor;
    }

    result += markdown.slice(cursor);
    return result;
}

/** Decode every placeholder token back into its original fenced text. */
export function restoreFencedCode(markdown: string): string {
    return markdown.replace(
        PLACEHOLDER_REGEX,
        (_full, _type: string, _closed: string, encoded: string) => {
            return Buffer.from(encoded, "base64").toString("utf8");
        },
    );
}

/**
 * Replace placeholders of a matching type with `transform`'s result; leave
 * everything else — non-matching types, and unclosed fences regardless of
 * type — untouched as inert fence text. Lets a processor consume only its
 * own well-formed fences (e.g. ChartProcessor's "chart" fences) without
 * decoding every placeholder or re-checking closure itself.
 */
export function transformFencedCodeByType(
    markdown: string,
    predicate: (type: string) => boolean,
    transform: (block: FencedBlock) => string,
): string {
    return markdown.replace(
        PLACEHOLDER_REGEX,
        (full, type: string, closed: string, encoded: string) => {
            if (closed !== "1" || !predicate(type)) {
                return full;
            }
            const fenceText = Buffer.from(encoded, "base64").toString("utf8");
            return transform({ type, fenceText });
        },
    );
}

/** Strip a FencedBlock's opening and closing fence lines, returning just the content between them. */
export function extractFenceContent(fenceText: string): string {
    const openingMatch = /^(`{3,}|~{3,})[^\r\n]*(?:\r\n|\r|\n|$)/.exec(
        fenceText,
    );
    if (!openingMatch) {
        return fenceText;
    }
    const contentStart = openingMatch[0].length;

    const closingRegex = new RegExp(
        `(?<=\\r\\n|\\r|\\n)${openingMatch[1][0]}{3,}[ \\t]*$`,
    );
    const closingMatch = closingRegex.exec(fenceText);
    const contentEnd = closingMatch ? closingMatch.index : fenceText.length;

    return fenceText.slice(contentStart, contentEnd);
}

function makePlaceholder(
    type: string,
    closed: boolean,
    fenceText: string,
): string {
    const encoded = Buffer.from(fenceText, "utf8").toString("base64");
    const closedFlag = closed ? "1" : "0";
    return `${PLACEHOLDER_PREFIX}${type}${TYPE_SEPARATOR}${closedFlag}${TYPE_SEPARATOR}${encoded}${PLACEHOLDER_SUFFIX}`;
}

function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
