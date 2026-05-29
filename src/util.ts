// Native / no lodash
import { basename } from "node:path";
import { FONTAWESOME_PREFIXES } from "./slidesExtended-constants";

export function has(object: object, key: string): boolean {
    const keyParts = key.split(".");
    const rec = object as Record<string, unknown>;

    return (
        !!object &&
        (keyParts.length > 1
            ? has(rec[key.split(".")[0]] as object, keyParts.slice(1).join("."))
            : Object.hasOwn(object, key))
    );
}

export function pick(object: object, keys: string[]) {
    const rec = object as Record<string, unknown>;
    return keys.reduce(
        (obj, key) => {
            if (Object.hasOwn(object, key)) {
                obj[key] = rec[key];
            }
            return obj;
        },
        {} as Record<string, unknown>,
    );
}

export function omit(object: object, keys: string[]) {
    const rec = object as Record<string, unknown>;
    return Object.keys(rec).reduce(
        (obj, key) => {
            if (!keys.includes(key)) {
                obj[key] = rec[key];
            }
            return obj;
        },
        {} as Record<string, unknown>,
    );
}

export function omitBy(object: object, predicate: (value: unknown) => boolean) {
    const rec = object as Record<string, unknown>;
    return Object.keys(rec).reduce(
        (obj, key) => {
            if (!predicate(rec[key])) {
                obj[key] = rec[key];
            }
            return obj;
        },
        {} as Record<string, unknown>,
    );
}

export function isNil(value: unknown) {
    return value === null || value === undefined;
}

export function isEmpty(value: unknown) {
    return (
        isNil(value) ||
        value === "" ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === "object" &&
            value !== null &&
            Object.keys(value).length === 0)
    );
}

export function isUrl(path: string): boolean {
    return /^.*?:\/\//.test(path);
}

export function isIcon(path: string) {
    return FONTAWESOME_PREFIXES.some((prefix) => path.startsWith(prefix));
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
        path.endsWith("webm") ||
        path.endsWith("mkv")
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
