import type { Processor } from "src/@types";

export class BlockProcessor implements Processor {
    process(markdown: string) {
        return this.transformBlock(markdown);
    }

    transformBlock(markdown: string) {
        markdown = markdown.replaceAll(
            /:::\sblock\s*/g,
            '<div class="block">\n\n',
        );
        markdown = markdown.replaceAll(":::", "</div>\n\n");
        return markdown;
    }
}
