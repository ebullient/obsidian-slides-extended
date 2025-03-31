import type { Processor } from "src/@types";

export class IconsProcessor implements Processor {
    private regex = /:(fas|far|fal|fad|fab)_([\w-]+):/g;

    process(markdown: string) {
        return this.transformIconShortcode(markdown);
    }

    transformIconShortcode(markdown: string) {
        markdown = markdown.replaceAll(this.regex, "![]($1 fa-$2)");
        return markdown;
    }
}
