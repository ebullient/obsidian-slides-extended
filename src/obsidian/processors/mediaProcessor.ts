import { isIcon, isImage, isUrl, isVideo, mimeTypeFor } from "src/util";
import { CommentParser } from "../comment";
import type { ObsidianUtils } from "../obsidianUtils";

export class MediaProcessor {
    private utils: ObsidianUtils;
    private parser: CommentParser;

    private markdownMediaRegex =
        /(!)?\[([^\]]*)\]\((.*(?:jpg|png|jpeg|gif|bmp|webp|svg|avi|mp4|ogg|mov|webm)?)(?: ".*?")?\)\s?(<!--.*-->)?/gi;

    private wikilinkMediaRegex =
        /\[\[(.*?(?:jpg|png|jpeg|webp|gif|bmp|svg|avi|mp4|ogg|mov|webm))\|?([^\]]*)??\]\]/gi;

    constructor(utils: ObsidianUtils) {
        this.utils = utils;
        this.parser = new CommentParser();
    }

    process(markdown: string) {
        return markdown
            .split("\n")
            .map((line) => {
                // Transform [[myImage.png]] to [](myImage.png) (media only)
                return line.replace(
                    this.wikilinkMediaRegex,
                    (_, image, altText) => {
                        const alias = altText ?? "";
                        return `[${alias}](${image})`;
                    },
                );
            })
            .map((line) => {
                // Look at all markdown links (images or not)
                // embedded remote links may not have image file extensions..
                if (this.markdownMediaRegex.test(line)) {
                    return this.htmlify(line);
                }
                return line;
            })
            .join("\n");
    }

    private buildComment(ext: string, commentAsString: string) {
        const comment = commentAsString
            ? this.parser.parseComment(commentAsString)
            : this.parser.buildComment("element");

        if (ext) {
            let width: string;
            let height: string;
            if (ext.includes("x")) {
                [width, height] = ext.split("x");
            } else {
                width = ext;
            }
            comment.addStyle("width", `${width}px`);

            if (height) {
                comment.addStyle("height", `${height}px`);
            }
        }
        return this.parser.commentToString(comment);
    }

    private htmlify(line: string) {
        let result = "";
        let lastIndex = 0;

        this.markdownMediaRegex.lastIndex = 0;
        while (true) {
            const m = this.markdownMediaRegex.exec(line);
            if (m == null) {
                break;
            }
            if (m.index === this.markdownMediaRegex.lastIndex) {
                this.markdownMediaRegex.lastIndex++;
            }

            // eslint-disable-next-line prefer-const
            let [match, embed, alt, mediaPath, commentString] = m;

            let filePath = mediaPath;
            const icon = isIcon(filePath);
            const video = isVideo(filePath);
            const image = isUrl(filePath) || isImage(filePath);

            if (!icon && !image && !video) {
                // This is not an icon or an image. Leave it.
                result += line.substring(lastIndex, m.index) + match;
                lastIndex = this.markdownMediaRegex.lastIndex;
                continue;
            }

            if ((image || video) && !isUrl(filePath)) {
                // This is a regular file (of some kind)
                // it will include /local-file-url references, too
                filePath = this.utils.findMediaFile(mediaPath);
                if (this.utils.shouldCollect()) {
                    this.utils.addMedia(filePath);
                }
            }

            if (line.match(/^(?:[ ]{4,}|\t)!\[/)) {
                // leading indent, leave as-is
                embed = " ";
            }

            let update = "";
            if (embed === "!" && (icon || image || video)) {
                update = this.createImageElement(filePath, alt, commentString);
            } else {
                update = this.updateMarkdownLink(
                    line,
                    match,
                    mediaPath,
                    filePath,
                );
            }

            // Append the text before the match and the updated match
            result += line.substring(lastIndex, m.index) + update;
            lastIndex = this.markdownMediaRegex.lastIndex;
        }
        return result + line.substring(lastIndex);
    }

    private updateMarkdownLink(
        line: string,
        match: string,
        imagePath: string,
        filePath: string,
    ): string {
        const updated = match.replace(imagePath, filePath);
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
        let result = "";
        if (alt.match(/(?:^|\|)(\d+x?\d*)$/)) {
            const parts = alt.split("|");
            const size = parts.length > 1 ? parts[1] : parts[0];
            if (parts.length > 1) {
                alt = parts[0];
            }
            commentString = this.buildComment(size, commentString) ?? "";
            alt = "";
        }
        const type = mimeTypeFor(filePath);

        const comment =
            this.parser.parseLine(commentString) ??
            this.parser.buildComment("element");

        if (isIcon(filePath)) {
            result = `<i class="${filePath}" ${this.parser.buildAttributes(comment)}></i>\n`;
        } else {
            if (comment.hasStyle("width") && !comment.hasStyle("object-fit")) {
                comment.addStyle("object-fit", "fill");
            }

            if (!comment.hasStyle("align-self")) {
                if (comment.hasAttribute("align")) {
                    const align = comment.getAttribute("align");

                    switch (align) {
                        case "left":
                            comment.addStyle("align-self", "start");
                            break;
                        case "right":
                            comment.addStyle("align-self", "end");
                            break;
                        case "center":
                            comment.addStyle("align-self", "center");
                            break;
                        case "stretch":
                            comment.addStyle("align-self", "stretch");
                            comment.addStyle("object-fit", "cover");
                            comment.addStyle("height", "100%");
                            comment.addStyle("width", "100%");
                            break;
                        default:
                            break;
                    }
                    comment.deleteAttribute("align");
                }
            }

            if (!comment.hasStyle("object-fit")) {
                comment.addStyle("object-fit", "scale-down");
            }

            const html = isVideo(filePath)
                ? `<video ${this.parser.buildAttributes(comment)}><source src="${filePath}" alt="${alt}" type="${type}" /></video>\n`
                : `<img src="${filePath}" alt="${alt}" ${this.parser.buildAttributes(comment)}>\n`;
            result = html;
        }
        return result;
    }
}
