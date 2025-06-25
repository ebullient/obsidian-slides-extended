import type { Options, Processor } from "src/@types";

export class FootnoteProcessor implements Processor {
    private regex = /\[\^([^\]]*)]/im;

    process(markdown: string, options: Options) {
        let output = markdown;

        markdown
            .split(new RegExp(options.separator, "gmi"))
            .map((slidegroup, _index) => {
                return slidegroup
                    .split(new RegExp(options.verticalSeparator, "gmi"))
                    .map((slide, _index) => {
                        if (this.regex.test(slide)) {
                            const newSlide = this.transformFootNotes(slide);
                            output = output.replace(slide, newSlide);
                            return newSlide;
                        }
                        return slide;
                    })
                    .join(options.verticalSeparator);
            })
            .join(options.separator);
        return output;
    }

    transformFootNotes(markdown: string) {
        if (!this.regex.test(markdown)) {
            return markdown;
        }

        let input = markdown;
        let noteIdx = 1;

        const footNotes = new Map();

        while (true) {
            const reResult = this.regex.exec(input);
            if (!reResult) {
                break;
            }
            input = input
                .split("\n")
                .map((line) => {
                    if (line.includes(reResult[0])) {
                        if (line.includes(`${reResult[0]}: `)) {
                            if (!footNotes.has(reResult[1])) {
                                footNotes.set(
                                    reResult[1],
                                    line.split(`${reResult[0]}: `)[1],
                                );
                            }
                            return "";
                        }
                        const split = line.split(reResult[0]);

                        let result = split[0].trim();
                        result += `<sup id="fnref:${reResult[1]}" role="doc-noteref">${noteIdx}</sup>`;
                        result += split[1].trim();

                        noteIdx = noteIdx + 1;

                        return result;
                    }
                    return line;
                })
                .join("\n");
        }

        let footNotesBlock = "";
        footNotesBlock += '<div class="footnotes" role="doc-endnotes">\n';
        footNotesBlock += "<ol>\n";

        footNotes.forEach((value, key) => {
            footNotesBlock += `<li id="fn:${key}" role="doc-endnote" class="footnote"><p>\n\n${value}\n\n</p></li>`;
        });

        footNotesBlock += "</ol>\n";
        footNotesBlock += "</div>\n";

        const footnotePlaceholder = "<%? footnotes %>";

        if (input.includes(footnotePlaceholder)) {
            return input.replaceAll(footnotePlaceholder, footNotesBlock);
        }
        return `${input}\n${footNotesBlock}`;
    }
}
