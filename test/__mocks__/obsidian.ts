export { parse as parseYaml } from "yaml";

export class EditorSuggest<T> {
    context: unknown = null;
    constructor(_app: unknown) {
    }
    close() {}
}

// Real ObsidianUtils does `instanceof FileSystemAdapter` to confirm desktop
// support; tests construct a fake adapter that extends this so that check
// passes without pulling in the real Obsidian runtime.
export class FileSystemAdapter {
    getBasePath(): string {
        return "";
    }
    getFullPath(relativePath: string): string {
        return relativePath;
    }
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
