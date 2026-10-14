import { assignSlideIds } from "../src/obsidian/slideIdGenerator";
import { YamlStore } from "../src/yaml/yamlStore";
import { getSlideOptions } from "./testUtils";

describe("Slide ID Generator", () => {
    const separator = "\\r?\\n---\\r?\\n";
    const verticalSeparator = "\\r?\\n--\\r?\\n";

    beforeEach(() => {
        YamlStore.getInstance().options = getSlideOptions({});
    });

    test("Plain Slide Deck: adds data-id to all slides", () => {
        const input = `Slide 1 content

---

Slide 2 content

--

Slide 3 content`;

        const { modifiedMarkdown, hasChanges } = assignSlideIds(
            input,
            separator,
            verticalSeparator
        );

        expect(hasChanges).toBe(true);

        // Split slides
        const parts = modifiedMarkdown.split(/\r?\n(?:---|--)\r?\n/);
        expect(parts).toHaveLength(3);

        // Each part should contain a slide comment with a data-id attribute
        for (const part of parts) {
            expect(part).toMatch(/<!-- \.slide: .*data-id="[a-f0-9]{32}".* -->/);
            // Verify there are no dashes in the UUID
            const match = part.match(/data-id="([^"]+)"/);
            expect(match).not.toBeNull();
            const id = match![1];
            expect(id).toHaveLength(32);
            expect(id).not.toContain("-");
        }
    });

    test("Slides with Existing Slide Comments: appends data-id and preserves transformed attributes", () => {
        const input = `<!-- .slide: bg="black" class="my-class" -->
# Slide 1

---

<!-- slide bg="red" -->
# Slide 2`;

        const { modifiedMarkdown, hasChanges } = assignSlideIds(
            input,
            separator,
            verticalSeparator
        );

        expect(hasChanges).toBe(true);

        // Slide 1 should preserve transformed bg (data-background-color="black") and classes, plus data-id
        expect(modifiedMarkdown).toContain('data-background-color="black"');
        expect(modifiedMarkdown).toContain('class="my-class');
        expect(modifiedMarkdown).toContain('data-id="');

        // Slide 2 should be updated with transformed bg and data-id
        expect(modifiedMarkdown).toContain('data-background-color="red"');

        // Let's verify each has a 32-char dashless hex data-id
        const matches = [...modifiedMarkdown.matchAll(/data-id="([a-f0-9]{32})"/g)];
        expect(matches).toHaveLength(2);
        for (const match of matches) {
            expect(match[1]).not.toContain("-");
        }
    });

    test("Slides with Existing data-id: remains completely untouched", () => {
        const input = `<!-- .slide: data-id="alreadyexists123" bg="blue" -->
# Slide 1

---

<!-- .slide: data-id="alreadyexists456" -->
# Slide 2`;

        const { modifiedMarkdown, hasChanges } = assignSlideIds(
            input,
            separator,
            verticalSeparator
        );

        expect(hasChanges).toBe(false);
        expect(modifiedMarkdown).toBe(input);
    });

    test("Preserved Separators: keeps custom formatting and spaces around separators completely identical", () => {
        const input = `Slide 1

   ---   

Slide 2

\t--\t

Slide 3`;

        const customSeparator = "\\s*---\\s*";
        const customVerticalSeparator = "\\s*--\\s*";

        const { modifiedMarkdown, hasChanges } = assignSlideIds(
            input,
            customSeparator,
            customVerticalSeparator
        );

        expect(hasChanges).toBe(true);
        expect(modifiedMarkdown).toContain("   ---   ");
        expect(modifiedMarkdown).toContain("\t--\t");
    });
});
