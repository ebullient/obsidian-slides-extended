import type { Options, Processor } from "../../@types";
import { Properties } from "../../obsidian/transformers";

export class GridProcessor implements Processor {
    private gridBlockRegex = /<\s*grid(?:(?!(<grid|<\/grid>)).)*<\/grid>/gs;
    private gridRegex = /<\s*grid([^>]+)>(.*?)<\/grid>/s;
    private gridPropertiesRegex =
        /([^=]*)\s*=\s*"([^"]*)"\s*|([^=]*)\s*=\s*'([^']*)'\s*/g;

    process(markdown: string, options: Options) {
        let output = markdown;
        let gridIndex = 0;

        markdown
            .split(new RegExp(options.separator, "gmi"))
            .map((slidegroup) => {
                return slidegroup
                    .split(new RegExp(options.verticalSeparator, "gmi"))
                    .map((slide) => {
                        if (this.gridBlockRegex.test(slide)) {
                            let before = this.transformSlide(
                                slide,
                                () => gridIndex++,
                            );
                            let after: string;
                            while (after !== before) {
                                if (after) {
                                    before = after;
                                }
                                after = this.transformSlide(
                                    before,
                                    () => gridIndex++,
                                );
                            }
                            output = output.split(slide).join(after);
                            return after;
                        }
                        return slide;
                    })
                    .join(options.verticalSeparator);
            })
            .join(options.separator);

        return output;
    }

    transformSlide(slide: string, nextGridIndex: () => number) {
        const result: Map<string, string> = new Map<string, string>();
        this.gridBlockRegex.lastIndex = 0;

        while (true) {
            const m = this.gridBlockRegex.exec(slide);
            if (m == null) {
                break;
            }
            if (m.index === this.gridBlockRegex.lastIndex) {
                this.gridBlockRegex.lastIndex++;
            }
            const gridTag = m[0];

            const [match, attr, inner] = this.gridRegex.exec(gridTag);
            result.set(match, this.transformGrid(attr, inner, nextGridIndex()));
        }

        for (const [key, value] of result) {
            if (value) {
                slide = slide.split(key).join(value);
            }
        }
        return slide;
    }

    transformGrid(attr: string, inner: string, gridIndex: number): string {
        const attributes = this.parseAttributes(attr.trim());
        attributes.set("data-slides-grid", String(gridIndex));
        const properties = new Properties(attributes);
        return `<div class="${properties.getClasses()}" style="${properties.getStyles()}" ${properties.getAttributes()}>\n${inner}</div>`;
    }

    parseAttributes(attributes: string): Map<string, string> {
        const result: Map<string, string> = new Map<string, string>();
        this.gridPropertiesRegex.lastIndex = 0;

        while (true) {
            const m = this.gridPropertiesRegex.exec(attributes);
            if (m == null) {
                break;
            }
            if (m.index === this.gridPropertiesRegex.lastIndex) {
                this.gridPropertiesRegex.lastIndex++;
            }
            const [, key, value] = m;
            result.set(key, value);
        }

        return result;
    }
}
