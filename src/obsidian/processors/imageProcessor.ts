import { isIcon, isImage, isUrl } from 'src/util';
import { CommentParser } from '../comment';
import { ObsidianUtils } from '../obsidianUtils';

export class ImageProcessor {
    private utils: ObsidianUtils;
    private parser: CommentParser;

    private markdownImageRegex =
        /(!)?\[([^\]]*)\]\((.*(?:jpg|png|jpeg|gif|bmp|webp|svg)?)(?: ".*?")?\)\s?(<!--.*-->)?/gi;

    // post process/htmlify. Find non-embedded markdown image links
    private quotedMarkdownImageRegex = /"\[.*?\]\((.*?)\)"/gi;

    private wikilinkImageRegex =
        /\[\[(.*?(?:jpg|png|jpeg|webp|gif|bmp|svg))\|?([^\]]*)??\]\]/gi;

    constructor(utils: ObsidianUtils) {
        this.utils = utils;
        this.parser = new CommentParser();
    }

    process(markdown: string) {
        return markdown
            .split('\n')
            .map(line => {
                // Transform [[myImage.png]] to [](myImage.png)
                if (this.wikilinkImageRegex.test(line)) {
                    return this.transformImageWikilinkToMarkdown(line);
                }
                return line;
            })
            .map(line => {
                // Transform markdown image reference to html
                if (this.markdownImageRegex.test(line)) {
                    return this.htmlify(line);
                }
                return line;
            })
            .join('\n');
    }

    transformImageWikilinkToMarkdown(line: string): string {
        let result = line;

        let m;
        this.wikilinkImageRegex.lastIndex = 0;

        while ((m = this.wikilinkImageRegex.exec(result)) !== null) {
            if (m.index === this.wikilinkImageRegex.lastIndex) {
                this.wikilinkImageRegex.lastIndex++;
            }

            const [match, image, altText] = m;
            let alias = altText ?? '';
            if (!altText?.includes('|') && /\d+(x\d+)?/.test(altText)) {
                alias = `|${alias}`;
            }
            result = result.replace(match, `[${alias}](${image})`);
        }
        return result;
    }

    private buildComment(ext: string, commentAsString: string) {
        const comment = commentAsString
            ? this.parser.parseComment(commentAsString)
            : this.parser.buildComment('element');

        if (ext) {
            let width, height;
            if (ext.includes('x')) {
                [width, height] = ext.split('x');
            } else {
                width = ext;
            }
            comment.addStyle('width', `${width}px`);

            if (height) {
                comment.addStyle('height', `${height}px`);
            }
        }
        return this.parser.commentToString(comment);
    }

    private htmlify(line: string) {
        let result = '';
        let lastIndex = 0;

        let m;
        this.markdownImageRegex.lastIndex = 0;

        while ((m = this.markdownImageRegex.exec(line)) !== null) {
            if (m.index === this.markdownImageRegex.lastIndex) {
                this.markdownImageRegex.lastIndex++;
            }

            // eslint-disable-next-line prefer-const
            let [match, embed, alt, imagePath, commentString] = m;

            let filePath = imagePath;
            const icon = isIcon(filePath);
            const image = isUrl(filePath) || isImage(filePath);

            if (!icon && !image) {
                // This is not an icon or an image. Leave it.
                result += line.substring(lastIndex, m.index) + match;
                lastIndex = this.markdownImageRegex.lastIndex;
                continue;
            }

            if (filePath.startsWith('file:/')) {
                filePath = this.transformAbsoluteFilePath(filePath);
            } else if (!icon && !filePath.match(/^.*?:\/\//)) {
                filePath = this.utils.findFile(imagePath);

                if (this.utils.shouldCollect()) {
                    this.utils.addImage(filePath);
                }
            }

            if (line.match(/^(?:[ ]{4,}|\t)!\[/)) {
                // leading indent, leave as-is
                embed = ' ';
            }

            let update = '';
            if (embed === '!') {
                update = this.createImageElement(filePath, alt, commentString);
            } else {
                update = this.updateMarkdownLink(
                    line,
                    match,
                    imagePath,
                    filePath,
                );
            }

            // Append the text before the match and the updated match
            result += line.substring(lastIndex, m.index) + update;
            lastIndex = this.markdownImageRegex.lastIndex;
        }
        return result + line.substring(lastIndex);
    }

    private updateMarkdownLink(
        line: string,
        match: string,
        imagePath: string,
        filePath: string,
    ): string {
        let updated = match.replace(imagePath, filePath);
        if (line.indexOf(`"${match}"`) >= 0) {
            // if the match is within quotes, return the filepath alone
            return filePath;
        }
        return updated;
    }

    private createImageElement(
        filePath: string,
        alt: string,
        commentString: string,
    ): string {
        let result = '';
        if (alt && alt.includes('|')) {
            commentString =
                this.buildComment(alt.split('|')[1], commentString) ?? '';
            alt = alt.split('|')[0];
        }

        const comment =
            this.parser.parseLine(commentString) ??
            this.parser.buildComment('element');

        if (isIcon(filePath)) {
            result = `<i class="${filePath}" ${this.parser.buildAttributes(comment)}></i>\n`;
        } else {
            if (comment.hasStyle('width') && !comment.hasStyle('object-fit')) {
                comment.addStyle('object-fit', 'fill');
            }

            if (!comment.hasStyle('align-self')) {
                if (comment.hasAttribute('align')) {
                    const align = comment.getAttribute('align');

                    switch (align) {
                        case 'left':
                            comment.addStyle('align-self', 'start');
                            break;
                        case 'right':
                            comment.addStyle('align-self', 'end');
                            break;
                        case 'center':
                            comment.addStyle('align-self', 'center');
                            break;
                        case 'stretch':
                            comment.addStyle('align-self', 'stretch');
                            comment.addStyle('object-fit', 'cover');
                            comment.addStyle('height', '100%');
                            comment.addStyle('width', '100%');
                            break;
                        default:
                            break;
                    }
                    comment.deleteAttribute('align');
                }
            }

            if (!comment.hasStyle('object-fit')) {
                comment.addStyle('object-fit', 'scale-down');
            }
            const imageHtml = `<img src="${filePath}" alt="${alt}" ${this.parser.buildAttributes(comment)}>\n`;
            result = imageHtml;
        }
        return result;
    }

    private transformAbsoluteFilePath(path: string) {
        const pathURL = new URL(path);
        if (pathURL) {
            return '/localFileSlash' + pathURL.pathname;
        }
        return path;
    }
}
