import type { Processor } from "../../@types";
import { FONTAWESOME_PREFIXES } from "../../slidesExtended-constants";

export class IconsProcessor implements Processor {
    private regex = new RegExp(
        // biome-ignore lint/suspicious/noUselessEscapeInString: \w is a regex word character, not a string escape
        `:(${FONTAWESOME_PREFIXES.join("|")})_([\w-]+):`,
        "g",
    );

    process(markdown: string) {
        return this.transformIconShortcode(markdown);
    }

    transformIconShortcode(markdown: string) {
        return markdown.replaceAll(this.regex, "![]($1 fa-$2)");
    }
}
