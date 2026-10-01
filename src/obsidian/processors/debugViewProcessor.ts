import type { Options, Processor } from "../../@types";

export class DebugViewProcessor implements Processor {
    process(markdown: string, options: Options) {
        let output = markdown;

        if (options.showGrid) {
            markdown
                .split(new RegExp(options.separator, "gmi"))
                .map((slidegroup, _index) => {
                    return slidegroup
                        .split(new RegExp(options.verticalSeparator, "gmi"))
                        .map((slide, _index) => {
                            const [md, notes] = this.extractNotes(
                                slide,
                                options,
                            );

                            let newSlide = this.addDebugCode(md);
                            if (notes.length > 0) {
                                newSlide += `\n\n${notes}`;
                            }
                            output = output.replace(slide, () => newSlide);
                            return newSlide;
                        })
                        .join(options.verticalSeparator);
                })
                .join(options.separator);
        }
        return output;
    }

    addDebugCode(markdown: string) {
        let cells = "";
        for (let i = 0; i < 100; i++) {
            cells += '<div class="slides-extended-gridline"></div>';
        }

        return `${markdown}\n<div class="slides-extended-gridlines">${cells}</div>`;
    }

    extractNotes(input: string, options: Options): [string, string] {
        let noteSeparator = "note:";
        if (options.notesSeparator && options.notesSeparator.length > 0) {
            noteSeparator = options.notesSeparator;
        }

        const spliceIdx = input.indexOf(noteSeparator);
        if (spliceIdx > 0) {
            return [input.substring(0, spliceIdx), input.substring(spliceIdx)];
        }
        return [input, ""];
    }
}
