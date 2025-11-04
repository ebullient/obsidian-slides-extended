import type { Options, Processor } from "src/@types";
import { CommentParser } from "src/obsidian/comment";
import type { ObsidianUtils } from "src/obsidian/obsidianUtils";
import { FootnoteProcessor } from "./footNoteProcessor";
import { MultipleFileProcessor } from "./multipleFileProcessor";

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

        input
            .split(new RegExp(options.separator, "gmi"))
            .map((slidegroup) => {
                return slidegroup
                    .split(new RegExp(options.verticalSeparator, "gmi"))
                    .map((slide) => {
                        if (this.templateCommentRegex.test(slide)) {
                            try {
                                // eslint-disable-next-line prefer-const
                                let [md, notes] = this.extractNotes(
                                    slide,
                                    options,
                                );

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
                                md = this.computeVariables(md, options);
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
                        }
                        return slide;
                    })
                    .join(options.verticalSeparator);
            })
            .join(options.separator);
        return output;
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

    computeVariables(slide: string, options: Options): string {
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

            // eslint-disable-next-line prefer-const
            let [match, name, content] = m;

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
            if (options[key] != null) {
                result = result.replaceAll(m[0], `${options[key]}`);
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
