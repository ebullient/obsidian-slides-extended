export { load as parseYaml } from "js-yaml";

export class EditorSuggest<T> {
    context: unknown = null;
    constructor(_app: unknown) {
    }
    close() {}
}

// Obsidian extends String.prototype with .contains()
declare global {
    interface String {
        contains(s: string): boolean;
    }
    interface Array<T> {
        first(): T | undefined;
    }
}
