import { instance, mock, verify, when } from "ts-mockito";
import { ObsidianUtils } from "../src/obsidian/obsidianUtils";
import { MediaProcessor } from "../src/obsidian/processors/mediaProcessor";

describe("media references in fenced code", () => {
    test("leaves media syntax inert in backtick and tilde fences", () => {
        const mockedUtils = mock(ObsidianUtils);
        const processor = new MediaProcessor(instance(mockedUtils));
        const input = `# Markdown examples

\`\`\`markdown
![Backtick example](figs/backtick.svg)
\`\`\`

~~~markdown
![[figs/tilde.png]]
~~~`;

        expect(processor.process(input)).toBe(input);
        verify(mockedUtils.findMediaFile("figs/backtick.svg")).never();
        verify(mockedUtils.findMediaFile("figs/tilde.png")).never();
    });

    test("treats an unclosed fence as extending to the end", () => {
        const mockedUtils = mock(ObsidianUtils);
        const processor = new MediaProcessor(instance(mockedUtils));
        const input = `# Markdown example

\`\`\`markdown
![Example](figs/nonexistent.svg)`;

        expect(processor.process(input)).toBe(input);
        verify(mockedUtils.findMediaFile("figs/nonexistent.svg")).never();
    });

    test("supports longer fences and CRLF line endings", () => {
        const mockedUtils = mock(ObsidianUtils);
        const processor = new MediaProcessor(instance(mockedUtils));
        const input = [
            "# Markdown example",
            "````markdown",
            "![Example](figs/nonexistent.svg)",
            "`````",
        ].join("\r\n");

        expect(processor.process(input)).toBe(input);
        verify(mockedUtils.findMediaFile("figs/nonexistent.svg")).never();
    });

    test("still resolves and collects media outside fences", () => {
        const mockedUtils = mock(ObsidianUtils);
        when(mockedUtils.shouldCollect()).thenReturn(true);
        when(mockedUtils.findMediaFile("figs/real.svg")).thenReturn(
            "/vault/figs/real.svg",
        );
        const processor = new MediaProcessor(instance(mockedUtils));
        const input = `[Real figure](figs/real.svg)

\`\`\`markdown
![Example](figs/nonexistent.svg)
\`\`\``;

        const result = processor.process(input);

        expect(result).toContain("[Real figure](/vault/figs/real.svg)");
        expect(result).toContain(
            "```markdown\n![Example](figs/nonexistent.svg)\n```",
        );
        verify(mockedUtils.findMediaFile("figs/real.svg")).once();
        verify(mockedUtils.addMedia("/vault/figs/real.svg")).once();
        verify(mockedUtils.findMediaFile("figs/nonexistent.svg")).never();
    });
});
