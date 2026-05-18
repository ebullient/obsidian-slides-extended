// eslint.config.mjs
import globals from "globals";
import tsparser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
    ...obsidianmd.configs.recommended,
    globalIgnores([
        "dist/",
        "docs/",
        "reveal-plugin/",
        "se-test-vault/",
        "test/",
        "**/*.js",
        "*.mjs",
        "package.json"
    ]),
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                project: "./tsconfig.json"
            },
            globals: { ...globals.node, ...globals.browser },
        },
        rules: {
            "obsidianmd/ui/sentence-case": [
                "warn",
                {
                    brands: ["Slides Extended", "reveal.js"],
                    acronyms: ["CSS", "HTML", "Q"],
                    ignoreWords: [
                        "localhost",
                        "none", "fade", "slide", "convex", "concave", "zoom",
                        "slow", "default", "fast",
                        "black", "zenburn",
                        "progress",
                    ],
                },
            ],
        },
    },
]);
