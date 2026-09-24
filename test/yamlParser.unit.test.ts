import { DEFAULT_SETTINGS } from "../src/slidesExtended-constants";
import { YamlParser } from "../src/yaml/yamlParser";

const parser = new YamlParser(DEFAULT_SETTINGS);

describe("getRevealOptions numeric coercion", () => {
    test("margin string '0' is coerced to number 0", () => {
        const result = parser.getRevealOptions({ margin: "0" as unknown as number });
        expect(result.margin).toBe(0);
        expect(typeof result.margin).toBe("number");
    });

    test("margin string '0.1' is coerced to number 0.1", () => {
        const result = parser.getRevealOptions({ margin: "0.1" as unknown as number });
        expect(result.margin).toBe(0.1);
        expect(typeof result.margin).toBe("number");
    });

    test("margin number 0 remains number 0", () => {
        const result = parser.getRevealOptions({ margin: 0 });
        expect(result.margin).toBe(0);
        expect(typeof result.margin).toBe("number");
    });

    test("margin number 0.04 remains number 0.04", () => {
        const result = parser.getRevealOptions({ margin: 0.04 });
        expect(result.margin).toBe(0.04);
        expect(typeof result.margin).toBe("number");
    });

    test("width string '960' is coerced to number 960", () => {
        const result = parser.getRevealOptions({ width: "960" as unknown as number });
        expect(result.width).toBe(960);
        expect(typeof result.width).toBe("number");
    });

    test("height string '700' is coerced to number 700", () => {
        const result = parser.getRevealOptions({ height: "700" as unknown as number });
        expect(result.height).toBe(700);
        expect(typeof result.height).toBe("number");
    });

    test("non-numeric string value for margin is left as-is", () => {
        const result = parser.getRevealOptions({ margin: "auto" as unknown as number });
        expect(result.margin).toBe("auto");
    });

    test("multiple numeric props are all coerced", () => {
        const result = parser.getRevealOptions({
            margin: "0" as unknown as number,
            width: "1920" as unknown as number,
            height: "1080" as unknown as number,
            minScale: "0.2" as unknown as number,
            maxScale: "2.0" as unknown as number,
        });
        expect(result.margin).toBe(0);
        expect(result.width).toBe(1920);
        expect(result.height).toBe(1080);
        expect(result.minScale).toBe(0.2);
        expect(result.maxScale).toBe(2.0);
    });

    test("non-numeric reveal props are not coerced", () => {
        const result = parser.getRevealOptions({
            transition: "slide",
            controlsLayout: "bottom-right",
        });
        expect(result.transition).toBe("slide");
        expect(result.controlsLayout).toBe("bottom-right");
    });
});

describe("parseYamlFrontMatter + getRevealOptions round-trip", () => {
    test("margin: '0' from YAML frontmatter is coerced to number", () => {
        const input = '---\nmargin: "0"\n---\n\n# Slide';
        const { yamlOptions } = parser.parseYamlFrontMatter(input);
        const options = parser.getSlideOptions(yamlOptions);
        const revealOptions = parser.getRevealOptions(options);
        expect(revealOptions.margin).toBe(0);
        expect(typeof revealOptions.margin).toBe("number");
    });

    test("margin: 0 from YAML frontmatter stays as number", () => {
        const input = "---\nmargin: 0\n---\n\n# Slide";
        const { yamlOptions } = parser.parseYamlFrontMatter(input);
        const options = parser.getSlideOptions(yamlOptions);
        const revealOptions = parser.getRevealOptions(options);
        expect(revealOptions.margin).toBe(0);
        expect(typeof revealOptions.margin).toBe("number");
    });

    test("margin: 0.04 from YAML frontmatter stays as number", () => {
        const input = "---\nmargin: 0.04\n---\n\n# Slide";
        const { yamlOptions } = parser.parseYamlFrontMatter(input);
        const options = parser.getSlideOptions(yamlOptions);
        const revealOptions = parser.getRevealOptions(options);
        expect(revealOptions.margin).toBe(0.04);
        expect(typeof revealOptions.margin).toBe("number");
    });
});
