export class EditorSuggest<T> {
    context: unknown = null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_app: unknown) {}
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
String.prototype.contains = function (s: string): boolean {
    return this.includes(s);
};
// eslint-disable-next-line no-extend-native
Array.prototype.first = function () {
    return this[0];
};
