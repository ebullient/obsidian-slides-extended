import { isIcon, isImage, isUrl } from 'src/util';
import { ObsidianUtils } from '../obsidianUtils';

export class MultipleFileProcessor {
    private utils: ObsidianUtils;

    private regex = /!\[\[(.*?)(\|[^\]]*?)?\]\]/g;
    private excalidrawRegex = /(.*\.excalidraw)/i;
    private markdownRegex = /!\[.*?\]\((.*?\.md)\)/g;

    constructor(utils: ObsidianUtils) {
        this.utils = utils;
    }

    process(markdown: string): string {
        return markdown
            .split('\n')
            .map((line, index) => {
                if (this.regex.test(line)) {
                    return this.transformContent(line, this.regex);
                }
                if (this.markdownRegex.test(line)) {
                    return this.transformContent(line, this.markdownRegex);
                }
                return line;
            })
            .join('\n');
    }

    private transformContent(line: string, match: RegExp) {
        let comment = '';
        if (line.includes('<!--')) {
            comment = line.substring(line.indexOf('<!--'));
        }

        return line.replaceAll(match, (matched, link) => {
            let header: string = null;
            if (link.includes('#')) {
                const split = link.split('#');
                link = split[0];
                header = split[1];
            }

            if ( isImage(link) || isIcon(link) || isUrl(link)
            ) {
                return matched;
            }

            const fileName = this.getMarkdownFile(link.replace('%20', ' '));

            if (fileName === null) {
                return matched;
            }

            const content = this.utils.parseFile(fileName, header);
            if (!content) {
                return matched;
            }

            if (comment.length > 0) {
                return this.process(content + comment);
            } else {
                return this.process(content);
            }
        });
    }

    private getMarkdownFile(link: string) {
        if (this.excalidrawRegex.test(link)) {
            return null; // Do not import excalidraw files
        }

        let file = link;
        if (!link.toLowerCase().endsWith('.md')) {
            file = file + '.md';
        }
        return file;
    }
}
