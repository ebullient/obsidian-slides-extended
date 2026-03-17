import { readFileSync } from "node:fs";
import { join } from "node:path";
import Mustache from "mustache";

const TEMPLATE_DIR = "./src/template";

describe("Script injection in templates", () => {
    describe("reveal.html", () => {
        const template = readFileSync(
            join(TEMPLATE_DIR, "reveal.html"),
            "utf-8",
        );

        it("should render local script tags", () => {
            const context = {
                scriptPaths: ["my-plugin.js", "utils.js"],
                remoteScriptPaths: [] as string[],
                base: "/",
                slides: "",
                title: "Test",
                themeUrl: "dist/theme/black.css",
                highlightThemeUrl: "plugin/highlight/zenburn.css",
                revealOptionsStr: "{}",
            };

            const result = Mustache.render(template, context);

            expect(result).toContain(
                '<script src="/my-plugin.js"></script>',
            );
            expect(result).toContain(
                '<script src="/utils.js"></script>',
            );
        });

        it("should render remote script tags", () => {
            const context = {
                scriptPaths: [] as string[],
                remoteScriptPaths: [
                    "https://d3js.org/d3.v7.min.js",
                    "https://cdn.example.com/plugin.js",
                ],
                base: "/",
                slides: "",
                title: "Test",
                themeUrl: "dist/theme/black.css",
                highlightThemeUrl: "plugin/highlight/zenburn.css",
                revealOptionsStr: "{}",
            };

            const result = Mustache.render(template, context);

            expect(result).toContain(
                '<script src="https://d3js.org/d3.v7.min.js"></script>',
            );
            expect(result).toContain(
                '<script src="https://cdn.example.com/plugin.js"></script>',
            );
        });

        it("should render scripts before Reveal.initialize", () => {
            const context = {
                scriptPaths: ["my-plugin.js"],
                remoteScriptPaths: ["https://example.com/lib.js"],
                base: "/",
                slides: "",
                title: "Test",
                themeUrl: "dist/theme/black.css",
                highlightThemeUrl: "plugin/highlight/zenburn.css",
                revealOptionsStr: "{}",
            };

            const result = Mustache.render(template, context);

            const scriptPos = result.indexOf(
                '<script src="/my-plugin.js"></script>',
            );
            const remotePos = result.indexOf(
                '<script src="https://example.com/lib.js"></script>',
            );
            const initPos = result.indexOf("Reveal.initialize(options)");

            expect(scriptPos).toBeGreaterThan(-1);
            expect(remotePos).toBeGreaterThan(-1);
            expect(initPos).toBeGreaterThan(-1);
            expect(scriptPos).toBeLessThan(initPos);
            expect(remotePos).toBeLessThan(initPos);
        });

        it("should not render script tags when no scripts provided", () => {
            const context = {
                scriptPaths: [] as string[],
                remoteScriptPaths: [] as string[],
                base: "/",
                slides: "",
                title: "Test",
                themeUrl: "dist/theme/black.css",
                highlightThemeUrl: "plugin/highlight/zenburn.css",
                revealOptionsStr: "{}",
            };

            const result = Mustache.render(template, context);

            // Should not have any user script tags (only built-in ones)
            const scriptTags = result.match(
                /<script src="[^"]*"><\/script>/g,
            ) || [];
            const userScripts = scriptTags.filter(
                (tag) =>
                    !tag.includes("/dist/") &&
                    !tag.includes("/plugin/") &&
                    !tag.includes("fontawesome"),
            );
            expect(userScripts).toHaveLength(0);
        });
    });

    describe("embed.html", () => {
        const template = readFileSync(
            join(TEMPLATE_DIR, "embed.html"),
            "utf-8",
        );

        it("should render script tags in embed template", () => {
            const context = {
                scriptPaths: ["embed-script.js"],
                remoteScriptPaths: ["https://example.com/lib.js"],
                base: "/",
                slides: "",
                title: "Test",
                themeUrl: "dist/theme/black.css",
                highlightThemeUrl: "plugin/highlight/zenburn.css",
                revealOptionsStr: "{}",
            };

            const result = Mustache.render(template, context);

            expect(result).toContain(
                '<script src="/embed-script.js"></script>',
            );
            expect(result).toContain(
                '<script src="https://example.com/lib.js"></script>',
            );

            const scriptPos = result.indexOf(
                '<script src="/embed-script.js"></script>',
            );
            const initPos = result.indexOf("Reveal.initialize(options)");
            expect(scriptPos).toBeLessThan(initPos);
        });
    });
});
