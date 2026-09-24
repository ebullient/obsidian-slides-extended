import type { Options, Processor } from "../../@types";
import { CommentParser } from "../../obsidian/comment";
import type { ObsidianUtils } from "../../obsidian/obsidianUtils";
import { FootnoteProcessor } from "./footNoteProcessor";
import { MultipleFileProcessor } from "./multipleFileProcessor";

export interface SlideNumberVariables {
    slideNumber?: string;
    slidesTotal?: string;
    slideNumberH?: string;
    slideNumberV?: string;
    slideNumberC?: string;
    slideNumberT?: string;
    [key: string]: string | undefined;
}

export class TemplateProcessor implements Processor {
    private multipleFileProcessor: MultipleFileProcessor;
    private footnoteProcessor: FootnoteProcessor;

    private emptySlideCommentRegex = /<!--\s*(?:\.)?slide(?::)?\s*-->/g;
    private templateCommentRegex =
        /<!--\s*(?:\.)?slide.*(template="\[\[([^\]]+)\]\]"\s*).*-->/;
    private propertyRegex = /:::\s([^\n]+)\s*(.*?:::[^\n]*)/gs;

    private slideCommentRegex = /<!--\s*(?:\.)?slide.*-->/;

    private variableRegex = /<%\??(.*?)%>/g;
    private optionalRegex = /<%\?.*?%>/g;

    private utils: ObsidianUtils;
    private parser = new CommentParser();

    constructor(utils: ObsidianUtils) {
        this.utils = utils;
        this.multipleFileProcessor = new MultipleFileProcessor(utils);
        this.footnoteProcessor = new FootnoteProcessor();
    }

    process(markdown: string, options: Options) {
        let input = markdown;

        if (options.defaultTemplate != null) {
            markdown
                .split(new RegExp(options.separator, "gmi"))
                .map((slidegroup) => {
                    return slidegroup
                        .split(new RegExp(options.verticalSeparator, "gmi"))
                        .map((slide) => {
                            if (slide.trim().length === 0) {
                                return slide;
                            }
                            if (this.slideCommentRegex.test(slide)) {
                                const [slideAnnotation] =
                                    this.slideCommentRegex.exec(slide);
                                const comment =
                                    this.parser.parseLine(slideAnnotation);
                                if (!comment.hasAttribute("template")) {
                                    comment.addAttribute(
                                        "template",
                                        options.defaultTemplate,
                                        false,
                                    );
                                }
                                input = input
                                    .split(slide)
                                    .join(
                                        slide
                                            .split(slideAnnotation)
                                            .join(
                                                this.parser.commentToString(
                                                    comment,
                                                ),
                                            ),
                                    );
                            } else {
                                input = input
                                    .split(slide)
                                    .join(
                                        `<!-- slide template="${options.defaultTemplate}" -->\n${slide}`,
                                    );
                            }
                            return slide;
                        })
                        .join(options.verticalSeparator);
                })
                .join(options.separator);
        }

        let output = input;

        const separatorRegex = new RegExp(options.separator, "gmi");
        const verticalSeparatorRegex = new RegExp(
            options.verticalSeparator,
            "gmi",
        );

        // Precalculate total slides across all horizontal and vertical slides
        let totalSlides = 0;
        const slidegroups = input.split(separatorRegex);
        for (const slidegroup of slidegroups) {
            totalSlides += slidegroup.split(verticalSeparatorRegex).length;
        }

        const format = (options.slideNumberFormat as string) || "c";
        const slidesTotalStr = String(totalSlides);
        let currentSlide = 0;

        input
            .split(separatorRegex)
            .map((slidegroup, hIdx) => {
                const verticalSlides = slidegroup.split(verticalSeparatorRegex);
                const h = hIdx + 1;
                const hasVertical = verticalSlides.length > 1;

                return verticalSlides
                    .map((slide, vIdx) => {
                        currentSlide++;
                        const c = currentSlide;
                        const v = vIdx + 1;

                        const slideNumberStr = this.formatSlideNumber(
                            format,
                            h,
                            v,
                            c,
                            totalSlides,
                            hasVertical,
                        );

                        const slideNumbers: SlideNumberVariables = {
                            slideNumber: slideNumberStr,
                            slidesTotal: slidesTotalStr,
                            slideNumberH: String(h),
                            slideNumberV: hasVertical ? String(v) : "0",
                            slideNumberC: String(c),
                            slideNumberT: slidesTotalStr,
                        };

                        if (this.templateCommentRegex.test(slide)) {
                            try {
                                const [main, notes] = this.extractNotes(
                                    slide,
                                    options,
                                );

                                let md = main;
                                let circuitCounter = 0;
                                while (this.templateCommentRegex.test(md)) {
                                    circuitCounter++;
                                    md = this.transformSlide(md);

                                    if (circuitCounter > 9) {
                                        console.warn(
                                            "WARNING: Circuit in template hierarchy detected!",
                                        );
                                        break;
                                    }
                                }
                                md = md.replaceAll(
                                    this.emptySlideCommentRegex,
                                    "",
                                );
                                md = md.trim();
                                md = this.computeVariables(
                                    md,
                                    options,
                                    slideNumbers,
                                );
                                if (notes.length > 0) {
                                    md += `\n\n${notes}`;
                                }
                                output = output.split(slide).join(md);
                                return md;
                            } catch (error) {
                                console.error(
                                    `Cannot process template: ${error}`,
                                );
                                return slide;
                            }
                        } else if (slide.includes("<%")) {
                            const [main, notes] = this.extractNotes(
                                slide,
                                options,
                            );
                            let md = this.computeVariables(
                                main,
                                options,
                                slideNumbers,
                            );
                            if (notes.length > 0) {
                                md += `\n\n${notes}`;
                            }
                            output = output.split(slide).join(md);
                            return md;
                        }
                        return slide;
                    })
                    .join(options.verticalSeparator);
            })
            .join(options.separator);
        return output;
    }

    private formatSlideNumber(
        format: string,
        h: number,
        v: number,
        c: number,
        t: number,
        hasVertical: boolean,
    ): string {
        switch (format) {
            case "c":
                return String(c);
            case "c/t":
                return `${c}/${t}`;
            case "h.v":
                return hasVertical ? `${h}.${v}` : String(h);
            case "h/v":
                return hasVertical ? `${h}/${v}` : String(h);
            default:
                return format
                    .replace(/\bc\b/g, String(c))
                    .replace(/\bt\b/g, String(t))
                    .replace(/\bh\b/g, String(h))
                    .replace(/\bv\b/g, hasVertical ? String(v) : "0");
        }
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

    transformSlide(slide: string) {
        if (this.templateCommentRegex.test(slide)) {
            const [, templateProperty, file] =
                this.templateCommentRegex.exec(slide);
            let fileWithExtension = file;
            if (!fileWithExtension.endsWith(".md")) {
                fileWithExtension = `${fileWithExtension}.md`;
            }
            let templateContent = this.utils.parseFile(fileWithExtension, null);

            if (templateContent == null) {
                throw new Error(
                    `Template file not found: [[${file}]] (resolved to: ${fileWithExtension})`,
                );
            }

            templateContent =
                this.multipleFileProcessor.process(templateContent);
            templateContent = templateContent
                .split("<% content %>")
                .join(slide.replaceAll(templateProperty, ""));
            return templateContent;
        }
        return slide;
    }

    computeVariables(
        slide: string,
        options: Options,
        slideNumbers?: SlideNumberVariables,
    ): string {
        let result = slide;
        this.propertyRegex.lastIndex = 0;

        while (true) {
            const m = this.propertyRegex.exec(slide);
            if (m == null) {
                break;
            }
            if (m.index === this.propertyRegex.lastIndex) {
                this.propertyRegex.lastIndex++;
            }

            const [match, n, c] = m;
            let name = n;
            let content = c;

            if (name.includes("<!--")) {
                name = name.substring(0, name.indexOf("<!--"));
            }

            if (name.trim() === "block") continue;

            content = `::: block\n${content}`;

            const optionalName = `<%? ${name.trim()} %>`;
            name = `<% ${name.trim()} %>`;
            result = result.replaceAll(
                optionalName,
                () => `${content}\n${optionalName}`,
            );
            result = result.replaceAll(name, () => content);
            result = result.replaceAll(match, "");
        }
        result = this.footnoteProcessor.transformFootNotes(result);

        while (true) {
            const m = this.variableRegex.exec(result);
            if (m == null) {
                break;
            }
            const key = m[1].trim();
            if (slideNumbers && slideNumbers[key] != null) {
                result = result.replaceAll(m[0], slideNumbers[key] as string);
            } else if (options[key] != null) {
                result = result.replaceAll(m[0], options[key] as string);
            }
        }

        //Remove optional template variables
        while (true) {
            const m = this.optionalRegex.exec(result);
            if (m == null) {
                break;
            }
            if (m.index === this.optionalRegex.lastIndex) {
                this.optionalRegex.lastIndex++;
            }
            result = result.replaceAll(m[0], "");
        }
        return result;
    }
}
