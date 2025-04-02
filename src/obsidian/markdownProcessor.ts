import type { Options, Processor } from "../@types";
import { YamlStore } from "../yaml/yamlStore";
import type { ObsidianUtils } from "./obsidianUtils";
import { AutoClosingProcessor } from "./processors/autoClosingProcessor";
import { BlockProcessor } from "./processors/blockProcessor";
import { CalloutProcessor } from "./processors/calloutProcessor";
import { ChartProcessor } from "./processors/chartProcessor";
import { CommentProcessor } from "./processors/commentProcessor";
import { DebugViewProcessor } from "./processors/debugViewProcessor";
import { DefaultBackgroundProcessor } from "./processors/defaultBackgroundProcessor";
import { DropProcessor } from "./processors/dropProcessor";
import { EmojiProcessor } from "./processors/emojiProcessor";
import { ExcalidrawProcessor } from "./processors/excalidrawProcessor";
import { FootnoteProcessor } from "./processors/footNoteProcessor";
import { FormatProcessor } from "./processors/formatProcessor";
import { FragmentProcessor } from "./processors/fragmentProcessor";
import { GridProcessor } from "./processors/gridProcessor";
import { IconsProcessor } from "./processors/iconsProcessor";
import { InternalLinkProcessor } from "./processors/internalLinkProcessor";
import { LatexProcessor } from "./processors/latexProcessor";
import { MediaProcessor } from "./processors/mediaProcessor";
import { MermaidProcessor } from "./processors/mermaidProcessor";
import { MultipleFileProcessor } from "./processors/multipleFileProcessor";
import { ReferenceProcessor } from "./processors/referenceProcessor";
import { SkipSlideProcessor } from "./processors/skipSlideProcessor";
import { TemplateProcessor } from "./processors/templateProcessor";

interface ProcessStep {
    name: string;
    processor: Processor;
}

export class MarkdownProcessor {
    private multipleFileProcessor: MultipleFileProcessor;
    private blockProcessor: BlockProcessor;
    private mediaProcessor: MediaProcessor;
    private internalLinkProcessor: InternalLinkProcessor;
    private footnoteProcessor: FootnoteProcessor;
    private latexProcessor: LatexProcessor;
    private formatProcessor: FormatProcessor;
    private excalidrawProcessor: ExcalidrawProcessor;
    private mermaidProcessor: MermaidProcessor;
    private fragmentProcessor: FragmentProcessor;
    private gridProcessor: GridProcessor;
    private commentProcessor: CommentProcessor;
    private dropProcessor: DropProcessor;
    private autoClosingProcessor: AutoClosingProcessor;
    private emojiProcessor: EmojiProcessor;
    private iconsProcessor: IconsProcessor;
    private debugViewProcessor: DebugViewProcessor;
    private calloutProcessor: CalloutProcessor;
    private templateProcessor: TemplateProcessor;
    private chartProcessor: ChartProcessor;
    private defaultBackgroundProcessor: DefaultBackgroundProcessor;
    private referenceProcessor: ReferenceProcessor;
    private skipSlideProcessor: SkipSlideProcessor;
    private stripLatexBackTicks: Processor;

    constructor(utils: ObsidianUtils) {
        this.multipleFileProcessor = new MultipleFileProcessor(utils);
        this.blockProcessor = new BlockProcessor();
        this.mediaProcessor = new MediaProcessor(utils);
        this.internalLinkProcessor = new InternalLinkProcessor(utils);
        this.footnoteProcessor = new FootnoteProcessor();
        this.latexProcessor = new LatexProcessor();
        this.formatProcessor = new FormatProcessor();
        this.excalidrawProcessor = new ExcalidrawProcessor(utils);
        this.mermaidProcessor = new MermaidProcessor();
        this.fragmentProcessor = new FragmentProcessor();
        this.gridProcessor = new GridProcessor();
        this.commentProcessor = new CommentProcessor();
        this.dropProcessor = new DropProcessor();
        this.autoClosingProcessor = new AutoClosingProcessor();
        this.emojiProcessor = new EmojiProcessor();
        this.iconsProcessor = new IconsProcessor();
        this.debugViewProcessor = new DebugViewProcessor();
        this.calloutProcessor = new CalloutProcessor();
        this.templateProcessor = new TemplateProcessor(utils);
        this.chartProcessor = new ChartProcessor();
        this.defaultBackgroundProcessor = new DefaultBackgroundProcessor();
        this.referenceProcessor = new ReferenceProcessor();
        this.skipSlideProcessor = new SkipSlideProcessor();
        this.stripLatexBackTicks = {
            process: (markdown: string, _: Options) => {
                return markdown.replaceAll("%`%", "");
            },
        };
    }

    process(markdown: string, options: Options) {
        YamlStore.getInstance().options = options;

        let processedMarkdown = this.trimEnding(markdown, options);
        if (options.log) {
            this.log("begin", markdown, processedMarkdown);
        }

        // First phase: Template processing
        processedMarkdown = this.processTemplates(processedMarkdown, options);

        // Second phase: Core processors that modify slide structure
        processedMarkdown = this.processSlideStructure(
            processedMarkdown,
            options,
        );

        // Third phase: Content processors
        processedMarkdown = this.processContent(processedMarkdown, options);

        if (options.log) {
            this.log("end", markdown, processedMarkdown);
        }
        return processedMarkdown;
    }

    private processWithLog(
        before: string,
        options: Options,
        step: ProcessStep,
    ): string {
        const after = step.processor.process(before, options);
        if (options.log) {
            this.log(step.name, before, after);
        }
        return after;
    }

    private processTemplates(markdown: string, options: Options): string {
        // Process multi-file includes and templates
        // Trim trailing separators
        let before = markdown;
        let after: string;

        let circuitCounter = 0;
        while (before !== after) {
            circuitCounter++;
            if (after) {
                before = after;
            }

            // Process multiple file includes first
            after = this.processWithLog(before, options, {
                name: "multipleFileProcessor",
                processor: this.multipleFileProcessor,
            });

            // Then process templates
            after = this.processWithLog(after, options, {
                name: "templateProcessor",
                processor: this.templateProcessor,
            });

            // Remove default templates after first pass to prevent re-application
            options.defaultTemplate = null;

            // Circuit breaker to prevent infinite loops
            if (circuitCounter > 9) {
                console.warn(
                    "WARNING: Circuit in template hierarchy detected!",
                );
                break;
            }
        }
        if (options.log) {
            this.log("merge & template", markdown, after);
        }
        return after || before;
    }

    private processSlideStructure(markdown: string, options: Options): string {
        // Process slide structural elements in a specific order
        return [
            // Skip slides marked to be hidden
            {
                name: "skipSlideProcessor",
                processor: this.skipSlideProcessor,
            },
            // Add debug grid if enabled
            {
                name: "debugViewProcessor",
                processor: this.debugViewProcessor,
            },
            // Auto-close self-closing tags
            {
                name: "autoClosingProcessor",
                processor: this.autoClosingProcessor,
            },
            // Apply default backgrounds
            {
                name: "defaultBackgroundProcessor",
                processor: this.defaultBackgroundProcessor,
            },
        ].reduce(
            (md, step) => this.processWithLog(md, options, step),
            markdown,
        );
    }

    private processContent(markdown: string, options: Options): string {
        // Process content elements in a specific order
        return [
            // Process LaTeX content
            { name: "latexProcessor", processor: this.latexProcessor },
            // Process callouts
            {
                name: "calloutProcessor",
                processor: this.calloutProcessor,
            },
            // Convert emoji shortcodes
            { name: "emojiProcessor", processor: this.emojiProcessor },
            // Process icon shortcodes
            { name: "iconsProcessor", processor: this.iconsProcessor },
            // Process formatting
            { name: "formatProcessor", processor: this.formatProcessor },
            // Convert mermaid code blocks
            {
                name: "mermaidProcessor",
                processor: this.mermaidProcessor,
            },
            // Process block syntax
            { name: "blockProcessor", processor: this.blockProcessor },
            // Process footnotes
            {
                name: "footnoteProcessor",
                processor: this.footnoteProcessor,
            },
            // Process excalidraw embeds
            {
                name: "excalidrawProcessor",
                processor: this.excalidrawProcessor,
            },
            // Process media embeds
            { name: "mediaProcessor", processor: this.mediaProcessor },
            // Process internal links
            {
                name: "internalLinkProcessor",
                processor: this.internalLinkProcessor,
            },
            // Process reference blockrefs
            {
                name: "referenceProcessor",
                processor: this.referenceProcessor,
            },
            // Process fragments
            {
                name: "fragmentProcessor",
                processor: this.fragmentProcessor,
            },
            // Process drop layouts
            { name: "dropProcessor", processor: this.dropProcessor },
            // Process grid layouts
            { name: "gridProcessor", processor: this.gridProcessor },
            // Process slide comments
            {
                name: "commentProcessor",
                processor: this.commentProcessor,
            },
            // Process charts
            { name: "chartProcessor", processor: this.chartProcessor },
            {
                name: "stripLatexBackTicks",
                processor: this.stripLatexBackTicks,
            },
        ].reduce(
            (md, step) => this.processWithLog(md, options, step),
            markdown,
        );
    }

    postProcess = (element: HTMLElement) => {
        const paragraphs = element.findAll("p");
        for (const paragraph of paragraphs) {
            if (paragraph.innerText.startsWith(":::")) {
                paragraph.remove();
            }
        }
    };

    trimEnding(markdown: string, options: Options): string {
        const input = `${markdown}\n`;

        let m = new RegExp(options.separator, "gmi").exec(input);
        if (m !== null) {
            const [match] = m;

            if (input.endsWith(match)) {
                return input.substring(0, input.lastIndexOf(match));
            }
        }

        m = new RegExp(options.verticalSeparator, "gmi").exec(input);
        if (m !== null) {
            const [match] = m;

            if (input.endsWith(match)) {
                return input.substring(0, input.lastIndexOf(match));
            }
        }

        return markdown;
    }

    log(name: string, before: string, after: string) {
        if (before !== after) {
            console.debug(name, JSON.stringify({ before, after }));
        }
    }
}
