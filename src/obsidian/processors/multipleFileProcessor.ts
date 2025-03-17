import { isIcon, isImage, isUrl, isVideo } from "src/util";
import type { ObsidianUtils } from "../obsidianUtils";

export class MultipleFileProcessor {
    private utils: ObsidianUtils;

    private regex = /!\[\[(.*?)(\|[^\]]*?)?\]\]/g;
    private markdownRegex = /!\[.*?\]\((.*?\.md)\)/g;

    private excalidrawRegex = /(.*\.excalidraw)/i;

    private wikilinkFileRegex = /\[\[(file:.+?)(\|[^\]]+)?\]\]/gi;
    private fileUrlRegex = /(\[[^\]]*?\]\()(file:.+?)((?: ".*?")?\))/gi;

    constructor(utils: ObsidianUtils) {
        this.utils = utils;
    }

    process(markdown: string): string {
        return markdown
            .split("\n")
            .map((line, index) => {
                // replace file:// with /local-file-url in markdown links
                line = line.replace(
                    this.fileUrlRegex,
                    (_, linkText, fileUrl, titleAndClosing) => {
                        const transformedUrl =
                            this.transformAbsoluteFilePath(fileUrl);
                        return `${linkText}${transformedUrl}${titleAndClosing}`;
                    },
                );
                // replace file:// with /local-file-url in all wikilinks (images or not)
                line = line.replace(
                    this.wikilinkFileRegex,
                    (_, filePath, aliasWithPipe) => {
                        const alias = aliasWithPipe ? aliasWithPipe : "";
                        const transformedPath =
                            this.transformAbsoluteFilePath(filePath);
                        return `[[${transformedPath}${alias}]]`;
                    },
                );

                if (this.regex.test(line)) {
                    return this.transformContent(line, this.regex);
                }
                if (this.markdownRegex.test(line)) {
                    return this.transformContent(line, this.markdownRegex);
                }
                return line;
            })
            .join("\n");
    }

    private transformContent(line: string, match: RegExp) {
        let comment = "";
        if (line.includes("<!--")) {
            comment = line.substring(line.indexOf("<!--"));
        }

        return line.replaceAll(match, (matched, link) => {
            let header: string = null;
            if (link.includes("#")) {
                const split = link.split("#");
                link = split[0];
                header = split[1];
            }

            if (isImage(link) || isIcon(link) || isUrl(link) || isVideo(link)) {
                return matched;
            }

            const fileName = this.getMarkdownFile(link.replaceAll("%20", " "));
            if (fileName === null) {
                return matched;
            }

            const content = this.utils.parseFile(fileName, header);
            if (!content) {
                return matched;
            }

            const result = `\n<!-- begin::[${fileName}] -->
${this.process(content + comment).trim()}
<!-- end::[${fileName}] -->\n`;
            return result;
        });
    }

    private getMarkdownFile(link: string) {
        if (this.excalidrawRegex.test(link)) {
            return null; // Do not import excalidraw files
        }

        let file = link;
        if (!link.toLowerCase().endsWith(".md")) {
            file = `${file}.md`;
        }
        return file;
    }

    private transformAbsoluteFilePath(path: string) {
        const pathUrl = new URL(path);
        if (pathUrl) {
            return `/local-file-url${pathUrl.pathname}`;
        }
        console.debug("transformAbsoluteFilePath", path, "invalid url");
        return path;
    }
}
