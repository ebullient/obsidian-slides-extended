import type { Processor } from "../../@types";
import { extractFenceContent, transformFencedCodeByType } from "../fencedCode";

export class MermaidProcessor implements Processor {
    process(markdown: string) {
        return transformFencedCodeByType(
            markdown,
            (type) => type === "mermaid",
            (block) =>
                `\n<div class="mermaid">\n${extractFenceContent(block.fenceText)}\n</div>\n`,
        );
    }
}
