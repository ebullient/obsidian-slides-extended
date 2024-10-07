// Native / no lodash

export function has(object: Record<string, any>, key: string): boolean {
    const keyParts = key.split('.');

    return (
        !!object &&
        (keyParts.length > 1
            ? has(object[key.split('.')[0]], keyParts.slice(1).join('.'))
            : Object.prototype.hasOwnProperty.call(object, key))
    );
}

export function pick(object: Record<string, any>, keys: string[]) {
    return keys.reduce(
        (obj, key) => {
            if (object && object.hasOwnProperty(key)) {
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
        value === '' ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' && Object.keys(value).length === 0)
    );
}

export function isUrl(path: string): boolean {
    return /^.*?:\/\//.test(path);
}

export function isIcon(path: string) {
    return (
        path.startsWith('fas') ||
        path.startsWith('far') ||
        path.startsWith('fal') ||
        path.startsWith('fad') ||
        path.startsWith('fab')
    );
}

export function isImage(path: string) {
    return (
        path.endsWith('bmp') ||
        path.endsWith('gif') ||
        path.endsWith('jpeg') ||
        path.endsWith('jpg') ||
        path.endsWith('png') ||
        path.endsWith('svg') ||
        path.endsWith('webp')
    );
}
