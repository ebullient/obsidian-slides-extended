import type { Processor } from "src/@types";

export class ReferenceProcessor implements Processor {
    private refRegex = /\^[\w-]+\s/g;

    process(markdown: string) {
        return markdown.replaceAll(this.refRegex, "");
    }
}
