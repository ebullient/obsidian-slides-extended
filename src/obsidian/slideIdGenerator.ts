import { CommentParser } from "./comment";

const commentParser = new CommentParser();

function generateUUID(): string {
    let uuid = "";
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        uuid = crypto.randomUUID();
    } else {
        uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
    // Remove dashes to match slides.com and prevent regex parsing errors
    return uuid.replaceAll("-", "");
}

export function assignSlideIds(
    markdown: string,
    separator: string,
    verticalSeparator: string,
): { modifiedMarkdown: string; hasChanges: boolean } {
    const separatorRegex = new RegExp(separator, "gmi");
    const verticalSeparatorRegex = new RegExp(verticalSeparator, "gmi");

    interface Match {
        start: number;
        end: number;
        content: string;
    }
    const matches: Match[] = [];

    let match = separatorRegex.exec(markdown);
    while (match !== null) {
        matches.push({
            start: match.index,
            end: separatorRegex.lastIndex,
            content: match[0],
        });
        if (match.index === separatorRegex.lastIndex) {
            separatorRegex.lastIndex++;
        }
        match = separatorRegex.exec(markdown);
    }

    let vMatch = verticalSeparatorRegex.exec(markdown);
    while (vMatch !== null) {
        matches.push({
            start: vMatch.index,
            end: verticalSeparatorRegex.lastIndex,
            content: vMatch[0],
        });
        if (vMatch.index === verticalSeparatorRegex.lastIndex) {
            verticalSeparatorRegex.lastIndex++;
        }
        vMatch = verticalSeparatorRegex.exec(markdown);
    }

    // Sort matches chronologically
    matches.sort((a, b) => a.start - b.start);

    // Filter overlapping matches
    const nonOverlapping: Match[] = [];
    let lastEnd = 0;
    for (const m of matches) {
        if (m.start >= lastEnd) {
            nonOverlapping.push(m);
            lastEnd = m.end;
        }
    }

    // Segment document into slides and separators
    interface Segment {
        type: "slide" | "separator";
        content: string;
    }
    const segments: Segment[] = [];
    let currentIdx = 0;
    for (const m of nonOverlapping) {
        if (m.start > currentIdx) {
            segments.push({
                type: "slide",
                content: markdown.substring(currentIdx, m.start),
            });
        }
        segments.push({ type: "separator", content: m.content });
        currentIdx = m.end;
    }
    if (currentIdx < markdown.length) {
        segments.push({
            type: "slide",
            content: markdown.substring(currentIdx),
        });
    }

    // Process slide content segments
    const slideCommentRegex = /<!--\s*(?:\.)?slide.*-->/;
    let hasChanges = false;

    for (const segment of segments) {
        if (segment.type === "slide") {
            const content = segment.content;
            if (slideCommentRegex.test(content)) {
                const commentMatch = slideCommentRegex.exec(content)?.[0];
                if (commentMatch) {
                    const comment = commentParser.parseLine(commentMatch);
                    if (comment && !comment.hasAttribute("data-id")) {
                        comment.addAttribute("data-id", generateUUID());
                        segment.content = content.replace(
                            slideCommentRegex,
                            commentParser.commentToString(comment),
                        );
                        hasChanges = true;
                    }
                }
            } else {
                // Insert a slide comment at the first non-empty line
                const lines = content.split("\n");
                let insertIdx = 0;
                while (
                    insertIdx < lines.length &&
                    lines[insertIdx].trim() === ""
                ) {
                    insertIdx++;
                }
                const uuid = generateUUID();
                lines.splice(
                    insertIdx,
                    0,
                    `<!-- .slide: data-id="${uuid}" -->`,
                );
                segment.content = lines.join("\n");
                hasChanges = true;
            }
        }
    }

    return {
        modifiedMarkdown: segments.map((s) => s.content).join(""),
        hasChanges,
    };
}
