import { existsSync } from "node:fs";
import path from "node:path";

export interface AssetLookup {
    exists(candidatePath: string): boolean;
}

export const NodeFsAssetLookup: AssetLookup = {
    exists: (candidatePath) => existsSync(candidatePath),
};

/**
 * Any search directory's trailing segment (e.g. "css" for ".../assets/css")
 * is also treated as a redundant prefix a caller may repeat in the
 * requested name (e.g. "css: css/file.css") — this was previously an
 * accident of a basename-only glob fallback that only applied to CSS
 * files; here it's an explicit, bounded rule applied consistently to
 * every asset type. Checked against every directory's basename in the
 * search path, not just the one currently being tried, so the rescue
 * doesn't silently depend on a css/js-suffixed directory being present
 * (or being tried first) alongside the one that actually holds the file.
 */
function stripRedundantPrefix(
    name: string,
    searchPath: string[],
): string | null {
    const normalizedName = name.replace(/\\/g, "/");
    const dirSegments = new Set(searchPath.map((dir) => path.basename(dir)));
    const slashIndex = normalizedName.indexOf("/");
    if (slashIndex === -1) {
        return null;
    }
    const leadingSegment = normalizedName.slice(0, slashIndex);
    if (!dirSegments.has(leadingSegment)) {
        return null;
    }
    return normalizedName.slice(slashIndex + 1);
}

/**
 * Resolves `name` against `searchPath` in order (vault-configured
 * directories must come first in that array — this function does not
 * reorder it) and returns the first match, or null if none is found.
 * Tries the direct-match form against every directory first (preserving
 * precedence order), then the redundant-prefix form against every
 * directory — so a direct match anywhere in the search path always wins
 * over a redundant-prefix match anywhere in it.
 *
 * A miss returns null and surfaces nothing to the user directly - callers
 * log to the console, not a Notice, so a single bad reference doesn't spam
 * a UI popup on every render.
 */
export function resolveAsset(
    name: string,
    searchPath: string[],
    lookup: AssetLookup,
): string | null {
    if (name.trim() === "") {
        return null;
    }

    for (const dir of searchPath) {
        const directPath = path.join(dir, name);
        if (lookup.exists(directPath)) {
            return directPath;
        }
    }

    const strippedName = stripRedundantPrefix(name, searchPath);
    if (strippedName !== null && strippedName.trim() !== "") {
        for (const dir of searchPath) {
            const strippedPath = path.join(dir, strippedName);
            if (lookup.exists(strippedPath)) {
                return strippedPath;
            }
        }
    }

    return null;
}

/**
 * theme/highlightTheme are configured as bare names (e.g. "black", per
 * DEFAULT_SETTINGS) rather than filenames with an extension, unlike
 * css/scripts. resolveAsset does only direct-path and redundant-prefix
 * matching, with no extension inference, so the bare form must be expanded
 * to a filename before it reaches resolveAsset. URLs and names that already
 * carry an extension are returned unchanged.
 */
export function withCssExtension(name: string): string {
    if (isValidUrl(name) || path.extname(name)) {
        return name;
    }
    return `${name}.css`;
}

function isValidUrl(input: string): boolean {
    try {
        new URL(input);
        return true;
    } catch {
        return false;
    }
}
