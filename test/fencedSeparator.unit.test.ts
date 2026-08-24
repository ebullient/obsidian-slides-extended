import {
    fenceAwareSlidify,
    INERT_SEPARATOR,
    preventBrowserResplitting,
} from "../src/reveal/fenceAwareSlidify";

const notesSeparator = "note:";

function slidify(
    markdown: string,
    separator = "\r?\n---\r?\n",
    verticalSeparator = "\r?\n###\r?\n",
) {
    const rawSlides = fenceAwareSlidify(
        markdown,
        { notesSeparator, separator, verticalSeparator },
        (content, options) => {
            expect(options.separator).toBe(INERT_SEPARATOR);
            expect(options.verticalSeparator).toBe(INERT_SEPARATOR);
            const safeContent = content.replace(
                /<\/script>/g,
                "__SCRIPT_END__",
            );
            return `<section  data-markdown><script type="text/template">${safeContent}</script></section>`;
        },
    );
    return preventBrowserResplitting(rawSlides);
}

function countMatches(value: string, pattern: RegExp): number {
    return value.match(pattern)?.length ?? 0;
}

describe("fenced slide separators", () => {
    test("keeps default horizontal separators inert inside a backtick fence", () => {
        const input = `# First vertical slide

###

# Second vertical slide

\`\`\`yaml
---
fenced: Verbatim
---
\`\`\``;

        const result = slidify(input);

        expect(countMatches(result, /data-markdown/g)).toBe(2);
        expect(result).toContain("```yaml\n---\nfenced: Verbatim\n---\n```");
        expect(result).toContain(
            `<section data-separator="${INERT_SEPARATOR}" data-separator-vertical="${INERT_SEPARATOR}" data-separator-notes="${INERT_SEPARATOR}" data-markdown>`,
        );
    });

    test("still splits horizontal separators outside the fence", () => {
        const input = `# First horizontal slide

---

# Second horizontal slide

\`\`\`yaml
---
fenced: Verbatim
---
\`\`\``;

        const result = slidify(input);

        expect(countMatches(result, /data-markdown/g)).toBe(2);
        expect(countMatches(result, /data-separator="\(\?!\)"/g)).toBe(2);
        expect(result).toContain("```yaml\n---\nfenced: Verbatim\n---\n```");
    });

    test("keeps configured horizontal separators inert inside a fence", () => {
        const input = `# First horizontal slide

@@@

# Second horizontal slide

\`\`\`text
@@@
verbatim separator
@@@
\`\`\``;

        const result = slidify(input, "\r?\n@@@\r?\n");

        expect(countMatches(result, /data-markdown/g)).toBe(2);
        expect(result).toContain("```text\n@@@\nverbatim separator\n@@@\n```");
    });

    test("supports tilde fences, longer fences, and CRLF", () => {
        const input = [
            "# First slide",
            "---",
            "# Second slide",
            "~~~~yaml",
            "---",
            "fenced: Verbatim",
            "---",
            "~~~~",
            "---",
            "# Third slide",
        ].join("\r\n");

        const result = slidify(input);

        expect(countMatches(result, /data-markdown/g)).toBe(3);
        expect(result).toContain(
            "~~~~yaml\r\n---\r\nfenced: Verbatim\r\n---\r\n~~~~",
        );
    });

    test("treats an unclosed fence as extending to the end of the note", () => {
        const input = `# Only slide

\`\`\`yaml
---
fenced: Verbatim`;

        const result = slidify(input);

        expect(countMatches(result, /data-markdown/g)).toBe(1);
        expect(result).toContain("```yaml\n---\nfenced: Verbatim");
    });

    test("preserves reveal.js horizontal precedence for overlapping patterns", () => {
        const input = `# First slide

###

# Second slide`;

        const result = slidify(input, "\r?\n###\r?\n", "\r?\n###\r?\n");

        expect(countMatches(result, /data-markdown/g)).toBe(2);
        expect(countMatches(result, /<section >/g)).toBe(0);
    });

    test("retains reveal.js script-end protection inside fenced examples", () => {
        const input = `# Slide

\`\`\`html
</script>
\`\`\``;

        const result = slidify(input);

        expect(result).toContain("__SCRIPT_END__");
        expect(result).not.toContain("```html\n</script>");
    });
});
