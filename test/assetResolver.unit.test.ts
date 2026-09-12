import path from "node:path";
import {
    type AssetLookup,
    resolveAsset,
    withCssExtension,
} from "../src/reveal/assetResolver";

function fakeLookup(existingPaths: string[]): AssetLookup {
    const normalized = new Set(existingPaths.map((p) => path.normalize(p)));
    return {
        exists: (candidatePath) =>
            normalized.has(path.normalize(candidatePath)),
    };
}

const assetsCss = path.join("vaultRoot", "assets", "css");
const assetsRoot = path.join("vaultRoot", "assets");
const pluginDir = path.join("pluginRoot", "slides-extended");
const distTheme = path.join(pluginDir, "dist", "theme");

test("Asset Resolver > minimal css reference resolves against assetsDir/css", () => {
    const lookup = fakeLookup([path.join(assetsCss, "file.css")]);
    const searchPath = [assetsCss, assetsRoot, pluginDir];

    expect(resolveAsset("file.css", searchPath, lookup)).toBe(
        path.join(assetsCss, "file.css"),
    );
});

test("Asset Resolver > redundant css/ prefix reference resolves against assetsDir/css", () => {
    const lookup = fakeLookup([path.join(assetsCss, "file.css")]);
    const searchPath = [assetsCss, assetsRoot, pluginDir];

    expect(resolveAsset("css/file.css", searchPath, lookup)).toBe(
        path.join(assetsCss, "file.css"),
    );
});

// The resolver operates on plain strings and search-path arrays with no
// awareness of "css" or "js" as concepts, so this uses an arbitrary
// extension to assert that directly rather than only ever testing CSS.
test("Asset Resolver > resolution is not file-type-specific", () => {
    const assetsFonts = path.join("vaultRoot", "assets", "fonts");
    const lookup = fakeLookup([path.join(assetsFonts, "file.woff2")]);
    const searchPath = [assetsFonts, assetsRoot];

    expect(resolveAsset("file.woff2", searchPath, lookup)).toBe(
        path.join(assetsFonts, "file.woff2"),
    );
    expect(resolveAsset("fonts/file.woff2", searchPath, lookup)).toBe(
        path.join(assetsFonts, "file.woff2"),
    );
});

test("Asset Resolver > missing file does not resolve", () => {
    const lookup = fakeLookup([path.join(assetsCss, "file.css")]);
    const searchPath = [assetsCss, assetsRoot, pluginDir];

    expect(resolveAsset("missing.css", searchPath, lookup)).toBeNull();
});

test("Asset Resolver > theme search path prefers vault asset over bundled dist/theme", () => {
    const lookup = fakeLookup([
        path.join(assetsCss, "file.css"),
        path.join(distTheme, "file.css"),
    ]);
    const searchPath = [assetsCss, assetsRoot, pluginDir, distTheme];

    expect(resolveAsset("file.css", searchPath, lookup)).toBe(
        path.join(assetsCss, "file.css"),
    );
});

test("Asset Resolver > bundled theme resolves via dist/theme fallback when no vault match exists", () => {
    const lookup = fakeLookup([path.join(distTheme, "black.css")]);
    const searchPath = [assetsCss, assetsRoot, pluginDir, distTheme];

    expect(resolveAsset("black.css", searchPath, lookup)).toBe(
        path.join(distTheme, "black.css"),
    );
});

// theme/highlightTheme are configured as bare names with no extension (e.g.
// DEFAULT_SETTINGS.theme === "black"), unlike css/scripts. resolveAsset
// itself does no extension inference, so callers must expand the name with
// withCssExtension first.
test("withCssExtension > bare theme name resolves once expanded to a filename", () => {
    const lookup = fakeLookup([path.join(distTheme, "black.css")]);
    const searchPath = [assetsCss, assetsRoot, pluginDir, distTheme];

    expect(resolveAsset(withCssExtension("black"), searchPath, lookup)).toBe(
        path.join(distTheme, "black.css"),
    );
});

test("withCssExtension > name with an existing extension is left unchanged", () => {
    expect(withCssExtension("custom.css")).toBe("custom.css");
    expect(withCssExtension("custom.scss")).toBe("custom.scss");
});

test("withCssExtension > bare name gets .css appended", () => {
    expect(withCssExtension("black")).toBe("black.css");
});

test("withCssExtension > URLs are left unchanged", () => {
    const url = "https://example.com/theme";
    expect(withCssExtension(url)).toBe(url);
});

// Guard: a non-matching prefix must not spuriously resolve via the
// redundant-prefix rule - it is bounded to the search directory's own
// trailing segment, not a general glob match.
test("Asset Resolver > non-matching prefix does not spuriously resolve", () => {
    const lookup = fakeLookup([path.join(assetsCss, "file.css")]);
    const searchPath = [assetsCss, assetsRoot, pluginDir];

    expect(resolveAsset("other/file.css", searchPath, lookup)).toBeNull();
});

// Regression guard for the class of Windows path-separator bug fixed
// piecemeal (and separately, more than once) in 7ab6318, c6bee54, 414b63e.
test("Asset Resolver > redundant prefix written with backslash still resolves", () => {
    const lookup = fakeLookup([path.join(assetsCss, "file.css")]);
    const searchPath = [assetsCss, assetsRoot, pluginDir];

    expect(resolveAsset("css\\file.css", searchPath, lookup)).toBe(
        path.join(assetsCss, "file.css"),
    );
});

test("Asset Resolver > posix-style search path and name resolve correctly", () => {
    const posixCss = "/vaultRoot/assets/css";
    const lookup: AssetLookup = {
        exists: (candidatePath) =>
            candidatePath === "/vaultRoot/assets/css/file.css",
    };

    expect(resolveAsset("file.css", [posixCss], lookup)).toBe(
        "/vaultRoot/assets/css/file.css",
    );
});

// Guard: empty/blank name must never resolve to the bare search directory
// itself (path.join(dir, "") === dir, and a directory "exists" too).
test("Asset Resolver > empty name does not resolve", () => {
    const lookup: AssetLookup = { exists: () => true };

    expect(resolveAsset("", [assetsCss], lookup)).toBeNull();
    expect(resolveAsset("   ", [assetsCss], lookup)).toBeNull();
});

// Redundant-prefix rescue must not depend on the css/js-suffixed directory
// being the one currently being tried - it must check every directory's
// basename in the search path, since a file can live directly under a
// root fallback entry while a same-shaped subfolder exists elsewhere.
test("Asset Resolver > redundant prefix resolves even when matching directory is not first in search path", () => {
    const lookup = fakeLookup([path.join(assetsRoot, "file.css")]);
    const searchPath = [assetsRoot, assetsCss];

    expect(resolveAsset("css/file.css", searchPath, lookup)).toBe(
        path.join(assetsRoot, "file.css"),
    );
});

// Redundant-prefix rescue must fail cleanly (not throw, not match) when no
// directory in the search path has a basename matching the leading segment.
test("Asset Resolver > redundant prefix does not resolve when no directory basename matches", () => {
    const lookup = fakeLookup([path.join(assetsRoot, "file.css")]);
    const searchPath = [assetsRoot];

    expect(resolveAsset("css/file.css", searchPath, lookup)).toBeNull();
});

// Precedence: a direct match anywhere in the search path must win over a
// redundant-prefix match anywhere in it, not just within one directory.
test("Asset Resolver > direct match anywhere in search path beats redundant-prefix match anywhere in it", () => {
    const lookup = fakeLookup([
        path.join(assetsRoot, "css", "file.css"),
        path.join(assetsCss, "file.css"),
    ]);
    // assetsRoot has no direct "css/file.css" on disk in this fixture setup;
    // instead a literal nested "css" folder under assetsRoot holds it,
    // which is a genuine direct match for the literal name "css/file.css".
    const searchPath = [assetsRoot, assetsCss];

    expect(resolveAsset("css/file.css", searchPath, lookup)).toBe(
        path.join(assetsRoot, "css", "file.css"),
    );
});
