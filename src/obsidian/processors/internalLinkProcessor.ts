import type { Options, Processor } from "src/@types";
import type { ObsidianUtils } from "../obsidianUtils";

export class InternalLinkProcessor implements Processor {
    private utils: ObsidianUtils;

    constructor(utils: ObsidianUtils) {
        this.utils = utils;
    }

    private regex = /(?<=[^!]|^)\[\[(?:(.*?)\|)?([^\]]*)\]\]/gm;

    process(markdown: string, options: Options) {
        if (options.enableLinks) {
            return markdown.replaceAll(this.regex, (sub, first, second) => {
                return `[${second}](obsidian://open?vault=${encodeURI(this.utils.vaultName)}&file=${encodeURI(
                    first === undefined ? second : first,
                )})`;
            });
        }
        return markdown.replaceAll(this.regex, "$2");
    }
}
