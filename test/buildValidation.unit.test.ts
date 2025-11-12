import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const BUILD_DIR = process.env.OUTDIR || "./build";
const TEMPLATE_DIR = "./src/template";

describe("Build Validation", () => {
    describe("Template References", () => {
        const templates = readdirSync(TEMPLATE_DIR).filter((f) =>
            f.endsWith(".html"),
        );

        for (const templateFile of templates) {
            describe(templateFile, () => {
                const templatePath = join(TEMPLATE_DIR, templateFile);
                const content = readFileSync(templatePath, "utf-8");

                // Extract all {{{base}}}path references (from any attribute or config)
                // Matches: {{{base}}}dist/..., {{{base}}}css/..., {{{base}}}plugin/...
                const basePathPattern =
                    /\{\{\{base\}\}\}((?:dist|css|plugin)\/[^"'}\s]+)/g;
                const matches = [...content.matchAll(basePathPattern)];

                if (matches.length === 0) {
                    it(`should have at least one {{{base}}} reference`, () => {
                        expect(matches.length).toBeGreaterThan(0);
                    });
                }

                for (const match of matches) {
                    const path = match[1];

                    // The load-mathjax.js script is now loaded dynamically with a cache-busting
                    // timestamp, so we can't statically verify its path.
                    if (!path.startsWith("plugin/load-mathjax.js")) {
                        it(`should have ${path} in build output`, () => {
                            const fullPath = join(BUILD_DIR, path);
                            expect(existsSync(fullPath)).toBe(true);
                        });
                    }
                }
            });
        }
    });

    describe("Critical Build Files", () => {
        const criticalFiles = [
            "dist/reveal.js",
            "plugin/math/math.js",
            "plugin/math/mathjax/tex-chtml.js",
            "plugin/load-mathjax.js",
            "plugin/obsidian-markdown.js",
            "template/reveal.html",
            "template/embed.html",
        ];

        for (const file of criticalFiles) {
            it(`should have ${file}`, () => {
                const fullPath = join(BUILD_DIR, file);
                expect(existsSync(fullPath)).toBe(true);
            });
        }
    });
});
