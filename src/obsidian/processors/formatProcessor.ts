import type { Options, Processor } from "src/@types";
import { processBySlide } from "../obsidianUtils";

export class FormatProcessor implements Processor {
    private boldRegex = /(?<=[^_]|^)__([^_]+)__(?!_)/gm;
    private markRegex = /==([^=]*)==/gm;
    private commentRegex = /%%([^%]*)%%/gm;

    process(markdown: string, options: Options) {
        let output = markdown;
        processBySlide(markdown, options, (slide) => {
            let newSlide = slide;
            newSlide = this.skipCodeBlocks(slide);
            output = output.replace(slide, () => newSlide);
            return newSlide;
        });
        return output;
    }

    skipCodeBlocks(markdown: string): string {
        const regex =
            /(?<=(^|\r|\n|\r\n))`{3,}.*?(\r|\n|\r\n)[\s\S]*?(\r|\n|\r\n)`{3,}(?=($|\r|\n|\r\n))/;
        const match = regex.exec(markdown);
        if (match) {
            return (
                this.formatText(markdown.substring(0, match.index)) +
                match[0] +
                this.skipCodeBlocks(
                    markdown.substring(match.index + match[0].length),
                )
            );
        }
        return this.formatText(markdown);
    }

    private formatText(markdown: string): string {
        // Split the text on your custom math-protection markers.
        // This regex will capture the delimiters and their contents.
        const parts = markdown.split(/(%`%[\s\S]+?%`%)/g);
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].startsWith("%`%")) {
                // Don't modify protected math segments at all
            } else {
                parts[i] = parts[i]
                    .replaceAll(
                        this.boldRegex,
                        (_, args) => `**${args.trim()}**`,
                    )
                    .replaceAll(this.markRegex, "<mark>$1</mark>")
                    .replaceAll(this.commentRegex, "");
            }
        }
        return parts.join("");
    }
}
