import type { Options, Processor } from "src/@types";

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
                            output = output.replace(slide, newSlide);
                            return newSlide;
                        })
                        .join(options.verticalSeparator);
                })
                .join(options.separator);
        }
        return output;
    }

    addDebugCode(markdown: string) {
        let gridBlock = "";
        gridBlock +=
            '<grid drag="100 10" drop="0 0" border="thin dotted blue"/>\n';
        gridBlock +=
            '<grid drag="100 10" drop="0 10" border="thin dotted blue"/>\n';
        gridBlock +=
            '<grid drag="100 10" drop="0 20" border="thin dotted blue"/>\n';
        gridBlock +=
            '<grid drag="100 10" drop="0 30" border="thin dotted blue"/>\n';
        gridBlock +=
            '<grid drag="100 10" drop="0 40" border="thin dotted blue"/>\n';
        gridBlock +=
            '<grid drag="100 10" drop="0 50" border="thin dotted blue"/>\n';
        gridBlock +=
            '<grid drag="100 10" drop="0 60" border="thin dotted blue"/>\n';
        gridBlock +=
            '<grid drag="100 10" drop="0 70" border="thin dotted blue"/>\n';
        gridBlock +=
            '<grid drag="100 10" drop="0 80" border="thin dotted blue"/>\n';
        gridBlock +=
            '<grid drag="100 10" drop="0 90" border="thin dotted blue"/>\n';

        gridBlock +=
            '<grid drag="10 100" drop="0 0" border="thin dotted blue"/>\n';
        gridBlock +=
            '<grid drag="10 100" drop="10 0" border="thin dotted blue"/>\n';
        gridBlock +=
            '<grid drag="10 100" drop="20 0" border="thin dotted blue"/>\n';
        gridBlock +=
            '<grid drag="10 100" drop="30 0" border="thin dotted blue"/>\n';
        gridBlock +=
            '<grid drag="10 100" drop="40 0" border="thin dotted blue"/>\n';
        gridBlock +=
            '<grid drag="10 100" drop="50 0" border="thin dotted blue"/>\n';
        gridBlock +=
            '<grid drag="10 100" drop="60 0" border="thin dotted blue"/>\n';
        gridBlock +=
            '<grid drag="10 100" drop="70 0" border="thin dotted blue"/>\n';
        gridBlock +=
            '<grid drag="10 100" drop="80 0" border="thin dotted blue"/>\n';
        gridBlock +=
            '<grid drag="10 100" drop="90 0" border="thin dotted blue"/>\n';

        return `${markdown}\n${gridBlock}`;
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
