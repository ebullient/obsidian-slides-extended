import { ObsidianUtils } from '../obsidianUtils';
import { Options } from '../../@types';

export class InternalLinkProcessor {
    private utils: ObsidianUtils;

    constructor(utils: ObsidianUtils) {
        this.utils = utils;
    }

    private regex = /(?<=[^!]|^)\[\[(?:(.*?)\|)?([^\]]*)\]\]/gm;

    process(markdown: string, options: Options) {
        if (options.enableLinks) {
            return markdown.replaceAll(this.regex, (sub, first, second) => {
                return `[${second}](obsidian://open?vault=${encodeURI(this.utils.vaultName)}&file=${encodeURI(
                    first == undefined ? second : first,
                )})`;
            });
        } else {
            return markdown.replaceAll(this.regex, `$2`);
        }
    }
}
