import { SlidePostProcessor } from "../src/obsidian/processors/slidePostProcessor";
import { YamlStore } from "../src/yaml/yamlStore";
import { getSlideOptions } from "./testUtils";

describe("SlidePostProcessor", () => {
    beforeEach(() => {
        YamlStore.getInstance().options = getSlideOptions({});
    });

    test("injects slide numbers and preserves existing slide annotations", () => {
        const processor = new SlidePostProcessor();
        const options = getSlideOptions({ slideNumberFormat: "h.v" });
        const result = processor.process(
            `<!-- slide class="title" -->
<% slideNumber %> / <% slidesTotal %> / <% slideNumberV %>
--
<% slideNumber %> / <% slideNumberC %>
---
<% slideNumber %>`,
            options,
        );

        const [firstGroup, secondGroup] = result.split(/\r?\n---\r?\n/);
        const [firstSlide, secondSlide] = firstGroup.split(/\r?\n--\r?\n/);

        expect(firstSlide).toContain(
            'style="--slide-number: 1; --slides-total: 3; --slide-number-h: 1; --slide-number-v: 1; --slide-number-c: 1; --slide-number-t: 3;',
        );
        expect(firstSlide).toContain('class="title"');
        expect(firstSlide).toContain("1.1 / 3 / 1");
        expect(secondSlide).toContain("1.2 / 2");
        expect(secondSlide).toContain("--slide-number-v: 2");
        expect(secondGroup).toContain("2");
        expect(secondGroup).toContain("--slide-number-v: 0");
    });

    test("injects inherited headings as inline HTML and CSS-safe plain text", () => {
        const processor = new SlidePostProcessor();
        const options = getSlideOptions({});
        const result = processor.process(
            `# Quarterly **Results**
<% h1 %>
---
## Revenue
<% h1 %> / <% h2 %>
---
# Next chapter
<%? h2 %>
--
### Detail
<% h1 %> / <% h3 %>
---
# First
# Last **heading**
<% h1 %>`,
            options,
        );

        const [first, second, thirdGroup, fourth] =
            result.split(/\r?\n---\r?\n/);
        const [third, vertical] = thirdGroup.split(/\r?\n--\r?\n/);

        expect(first).toContain("Quarterly <strong>Results</strong>");
        expect(first).toContain("--h1: 'Quarterly Results'");
        expect(first).not.toContain("--h1: &quot;");
        expect(second).toContain(
            "Quarterly <strong>Results</strong> / Revenue",
        );
        expect(second).toContain("--h2: 'Revenue'");
        expect(third).not.toContain("<%? h2 %>");
        expect(third).toContain("--h2: ''");
        expect(vertical).toContain("Next chapter / Detail");
        expect(fourth).toContain("Last <strong>heading</strong>");
        expect(fourth).toContain("--h1: 'Last heading'");
    });

    test("does not treat fenced headings as outline context", () => {
        const processor = new SlidePostProcessor();
        const options = getSlideOptions({});
        const result = processor.process(
            `# Real heading
---
\`\`\`md
# Not a heading
\`\`\`
<% h1 %>`,
            options,
        );

        const [, secondSlide] = result.split(/\r?\n---\r?\n/);
        expect(secondSlide).toContain("Real heading");
        expect(secondSlide).not.toContain("--h1: 'Not a heading'");
    });
});
