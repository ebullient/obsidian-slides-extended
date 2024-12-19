// Native / no lodash

import { basename } from "node:path";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function has(object: Record<string, any>, key: string): boolean {
    const keyParts = key.split(".");

    return (
        !!object &&
        (keyParts.length > 1
            ? has(object[key.split(".")[0]], keyParts.slice(1).join("."))
            : Object.prototype.hasOwnProperty.call(object, key))
    );
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function pick(object: Record<string, any>, keys: string[]) {
    return keys.reduce(
        (obj, key) => {
            // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
            if (object?.hasOwnProperty(key)) {
                obj[key] = object[key];
            }
            return obj;
        },
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        {} as Record<string, any>,
    );
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function omit(object: Record<string, any>, keys: string[]) {
    return Object.keys(object).reduce(
        (obj, key) => {
            if (!keys.includes(key)) {
                obj[key] = object[key];
            }
            return obj;
        },
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        {} as Record<string, any>,
    );
}

export function omitBy(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    object: Record<string, any>,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    predicate: (value: any) => boolean,
) {
    return Object.keys(object).reduce(
        (obj, key) => {
            if (!predicate(object[key])) {
                obj[key] = object[key];
            }
            return obj;
        },
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        {} as Record<string, any>,
    );
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function isNil(value: any) {
    return value === null || value === undefined;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function isEmpty(value: any) {
    return (
        isNil(value) ||
        value === "" ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === "object" && Object.keys(value).length === 0)
    );
}

export function isUrl(path: string): boolean {
    return /^.*?:\/\//.test(path);
}

export function isIcon(path: string) {
    return (
        path.startsWith("fas") ||
        path.startsWith("far") ||
        path.startsWith("fal") ||
        path.startsWith("fad") ||
        path.startsWith("fab")
    );
}

export function isImage(path: string) {
    return (
        path.endsWith("bmp") ||
        path.endsWith("gif") ||
        path.endsWith("jpeg") ||
        path.endsWith("jpg") ||
        path.endsWith("png") ||
        path.endsWith("svg") ||
        path.endsWith("webp")
    );
}

export function isVideo(path: string) {
    return (
        path.endsWith("avi") ||
        path.endsWith("mp4") ||
        path.endsWith("mov") ||
        path.endsWith("ogg") ||
        path.endsWith("webm")
    );
}

export function mimeTypeFor(fileName: string) {
    switch (basename(fileName).split(".").pop()) {
        case "avi":
            return "video/x-msvideo";
        case "bmp":
            return "image/bmp";
        case "gif":
            return "image/gif";
        case "jpeg":
            return "image/jpeg";
        case "jpg":
            return "image/jpeg";
        case "mov":
            return "video/quicktime";
        case "mpeg":
            return "video/mpeg";
        case "mp4":
            return "video/mp4";
        case "ogv":
            return "video/ogg";
        case "png":
            return "image/png";
        case "svg":
            return "image/svg+xml";
        case "webm":
            return "video/webm";
        case "webp":
            return "image/webp";
        default:
            return "";
    }
}
