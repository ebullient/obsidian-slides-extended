import type { Processor } from "../../@types";

export class AutoClosingProcessor implements Processor {
    private regex = /<(\s*?([\w]*)[^>]*?)\/(?<=\/)>/gm;

    process(markdown: string) {
        return this.transformBlock(markdown);
    }

    transformBlock(markdown: string) {
        markdown = markdown.replaceAll(this.regex, "<$1></$2>");
        return markdown;
    }
}
