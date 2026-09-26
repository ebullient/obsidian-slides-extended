import { MarkdownProcessor } from "../src/obsidian/markdownProcessor";
import { prepare } from "./testUtils";
import { obsidianUtils as utilsInstance } from "./__mocks__/mockObsidianUtils";

test("Show Grid renders a display:grid overlay of plain divs, not grids", () => {
    const input = `## My Slide

content
`;
    const { options, markdown } = prepare(input);
    options.showGrid = true;
    const out = new MarkdownProcessor(utilsInstance).process(markdown, options);

    // One container, 100 cells, all plain divs.
    expect(out.match(/slides-extended-gridlines/g)).toHaveLength(1);
    expect(out.match(/class="slides-extended-gridline"/g)).toHaveLength(100);

    // No grid mechanism involved: no <grid> tags for the lines and no
    // data-slides-grid stamped on any gridline cell.
    expect(out).not.toMatch(/<grid[^>]*slides-extended-gridline/);
    expect(out).not.toMatch(/slides-extended-gridline[^>]*data-slides-grid/);
});
