import type { SlidesExtendedPlugin } from "../slidesExtended-Plugin";
import type { EmbeddedSlideParameters } from "../@types";
import { load } from "js-yaml";

export class EmbeddedSlideProcessor {
    private plugin: SlidesExtendedPlugin;
    constructor(plugin: SlidesExtendedPlugin) {
        this.plugin = plugin;
    }

    handler = async (source: string, el: HTMLElement) => {
        try {
            const parameters = this.readParameters(source);
            const page = parameters.page ? `${parameters.page}` : "0";

            const url = new URL(
                `http://localhost:${this.plugin.settings.port}/embed/${parameters.slide}#/${page}`,
            );
            url.searchParams.append("embed", "true");

            const viewContent = el.createDiv();

            viewContent.empty();
            viewContent.addClass("reveal-preview-view");

            viewContent.createEl("iframe", {
                attr: {
                    src: url.toString(),
                    sandbox: "allow-scripts allow-same-origin allow-popups",
                },
            });
        } catch (e) {
            el.createEl("h2", { text: `Parameters invalid: ${e.message}` });
        }
    };

    readParameters(src: string): EmbeddedSlideParameters {
        const params = load(src) as EmbeddedSlideParameters;
        const slide = this.plugin.obsidianUtils.findFile(
            params.slide.toString(),
        );
        if (slide?.endsWith(".md")) {
            params.slide = slide;
        } else if (slide) {
            params.slide = `${slide}.md`;
        }
        return params;
    }
}
