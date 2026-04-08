/** biome-ignore-all lint/suspicious/noExplicitAny: utility/lodash-like function */
// Native / no lodash
import { basename } from "node:path";

export function has(object: Record<string, any>, key: string): boolean {
    const keyParts = key.split(".");

    return (
        !!object &&
        (keyParts.length > 1
            ? has(object[key.split(".")[0]], keyParts.slice(1).join("."))
            : Object.hasOwn(object, key))
    );
}

export function pick(object: Record<string, any>, keys: string[]) {
    return keys.reduce(
        (obj, key) => {
            // biome-ignore lint/suspicious/noPrototypeBuiltins: utility/lodash-like function
            if (object?.hasOwnProperty(key)) {
                obj[key] = object[key];
            }
            return obj;
        },
        {} as Record<string, any>,
    );
}

export function omit(object: Record<string, any>, keys: string[]) {
    return Object.keys(object).reduce(
        (obj, key) => {
            if (!keys.includes(key)) {
                obj[key] = object[key];
            }
            return obj;
        },
        {} as Record<string, any>,
    );
}

export function omitBy(
    object: Record<string, any>,
    predicate: (value: any) => boolean,
) {
    return Object.keys(object).reduce(
        (obj, key) => {
            if (!predicate(object[key])) {
                obj[key] = object[key];
            }
            return obj;
        },
        {} as Record<string, any>,
    );
}

export function isNil(value: any) {
    return value === null || value === undefined;
}

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
        path.endsWith("ogv") ||
        path.endsWith("webm")
    );
}

export function isAudio(path: string) {
    return (
        path.endsWith("mp3") ||
        path.endsWith("ogg") ||
        path.endsWith("oga") ||
        path.endsWith("wav") ||
        path.endsWith("m4a") ||
        path.endsWith("flac") ||
        path.endsWith("opus")
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
        case "ogg":
        case "oga":
            return "audio/ogg";
        case "png":
            return "image/png";
        case "svg":
            return "image/svg+xml";
        case "webm":
            return "video/webm";
        case "webp":
            return "image/webp";
        case "mp3":
            return "audio/mpeg";
        case "wav":
            return "audio/wav";
        case "m4a":
            return "audio/mp4";
        case "flac":
            return "audio/flac";
        case "opus":
            return "audio/ogg; codecs=opus";
        default:
            return "";
    }
}
