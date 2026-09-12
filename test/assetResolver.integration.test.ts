import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { FileSystemAdapter } from "obsidian";
import type { SlidesExtendedSettings } from "../src/@types";
import { ObsidianUtils } from "../src/obsidian/obsidianUtils";
import {
    NodeFsAssetLookup,
    resolveAsset,
    resolveDeckRelativeAsset,
    withCssExtension,
} from "../src/reveal/assetResolver";
import { DEFAULT_SETTINGS } from "../src/slidesExtended-constants";

// RevealRenderer.ts can't be imported under Jest (it pulls in reveal.js's
// markdown.js, an ESM file Jest isn't configured to transform), so these
// tests exercise resolveAsset/resolveDeckRelativeAsset directly against
// real ObsidianUtils search paths and temp-directory fixtures instead of
// going through RevealRenderer.findAsset.

// Minimal fake satisfying ObsidianUtils' App/vault/adapter surface.
function fakeApp(vaultBasePath: string) {
    const adapter = new FileSystemAdapter();
    adapter.getBasePath = () => vaultBasePath;
    adapter.getFullPath = (relativePath: string) =>
        path.join(vaultBasePath, relativePath);

    return {
        vault: {
            adapter,
            configDir: ".obsidian",
            getFiles: (): unknown[] => [],
        },
    } as unknown as import("obsidian").App;
}

function buildUtils(vaultBasePath: string, assetsDirectory: string) {
    const settings: SlidesExtendedSettings = Object.assign(
        {},
        DEFAULT_SETTINGS,
        { assetsDirectory },
    );
    return new ObsidianUtils(fakeApp(vaultBasePath), settings);
}

describe("ObsidianUtils search paths + resolveAsset end-to-end", () => {
    // One fixture tree built for the whole suite instead of per-test, since
    // every test here only reads paths it owns under its own subdirectory
    // (or the shared assets/dist tree, which no test mutates after setup) -
    // no test depends on another's cleanup, so sharing setup/teardown is
    // safe and avoids repeated real filesystem I/O per test.
    let vaultRoot: string;
    let assetsDir: string;
    let assetsCss: string;
    let assetsJs: string;
    let distTheme: string;

    beforeAll(() => {
        vaultRoot = mkdtempSync(path.join(tmpdir(), "slides-extended-"));
        assetsDir = path.join(vaultRoot, "assets");
        assetsCss = path.join(assetsDir, "css");
        assetsJs = path.join(assetsDir, "js");
        distTheme = path.join(
            vaultRoot,
            ".obsidian/plugins/slides-extended/dist/theme",
        );

        mkdirSync(assetsCss, { recursive: true });
        mkdirSync(assetsJs, { recursive: true });
        mkdirSync(distTheme, { recursive: true });

        writeFileSync(path.join(assetsCss, "custom.css"), "");
        writeFileSync(path.join(assetsJs, "custom.js"), "");
        writeFileSync(path.join(assetsDir, "root.css"), "");
        writeFileSync(path.join(assetsDir, "root.js"), "");
        writeFileSync(path.join(distTheme, "black.css"), "bundled");
        writeFileSync(path.join(assetsCss, "black.css"), "vault");
        writeFileSync(path.join(distTheme, "red.css"), "bundled-only");
    });

    afterAll(() => {
        rmSync(vaultRoot, { recursive: true, force: true });
    });

    test("minimal css reference resolves against assetsDir/css", () => {
        const utils = buildUtils(vaultRoot, "assets");
        const resolved = resolveAsset(
            "custom.css",
            utils.getLocalCssSearchPath(),
            NodeFsAssetLookup,
        );

        expect(resolved).toBe(path.join(assetsCss, "custom.css"));
    });

    test("redundant css/ prefix reference resolves against assetsDir/css", () => {
        const utils = buildUtils(vaultRoot, "assets");
        const resolved = resolveAsset(
            "css/custom.css",
            utils.getLocalCssSearchPath(),
            NodeFsAssetLookup,
        );

        expect(resolved).toBe(path.join(assetsCss, "custom.css"));
    });

    test("script reference resolves against assetsDir/js", () => {
        const utils = buildUtils(vaultRoot, "assets");
        const resolved = resolveAsset(
            "custom.js",
            utils.getScriptSearchPath(),
            NodeFsAssetLookup,
        );

        expect(resolved).toBe(path.join(assetsJs, "custom.js"));
    });

    test("redundant js/ prefix script reference resolves against assetsDir/js", () => {
        const utils = buildUtils(vaultRoot, "assets");
        const resolved = resolveAsset(
            "js/custom.js",
            utils.getScriptSearchPath(),
            NodeFsAssetLookup,
        );

        expect(resolved).toBe(path.join(assetsJs, "custom.js"));
    });

    test("asset directly under assetsDir root does not resolve - css only searches assetsDir/css", () => {
        const utils = buildUtils(vaultRoot, "assets");
        const resolved = resolveAsset(
            "root.css",
            utils.getLocalCssSearchPath(),
            NodeFsAssetLookup,
        );

        expect(resolved).toBeNull();
    });

    test("script directly under assetsDir root does not resolve - scripts only search assetsDir/js", () => {
        const utils = buildUtils(vaultRoot, "assets");
        const resolved = resolveAsset(
            "root.js",
            utils.getScriptSearchPath(),
            NodeFsAssetLookup,
        );

        expect(resolved).toBeNull();
    });

    test("vault theme takes precedence over bundled dist/theme match with the same name", () => {
        const utils = buildUtils(vaultRoot, "assets");
        const resolved = resolveAsset(
            "black.css",
            utils.getThemeSearchPath(),
            NodeFsAssetLookup,
        );

        expect(resolved).toBe(path.join(assetsCss, "black.css"));
    });

    test("bundled theme still resolves via dist/theme fallback when no vault match exists", () => {
        const utils = buildUtils(vaultRoot, "assets");
        const resolved = resolveAsset(
            "red.css",
            utils.getThemeSearchPath(),
            NodeFsAssetLookup,
        );

        expect(resolved).toBe(path.join(distTheme, "red.css"));
    });

    test("default theme setting ('black', no extension) resolves via dist/theme fallback", () => {
        // Uses a plain ObsidianUtils setup with no assetsDirectory match for
        // "black", so this exercises the real DEFAULT_SETTINGS.theme value
        // ("black") against the bundled dist/theme fallback specifically -
        // the vault-precedence test above covers the same filename when a
        // vault match also exists.
        const utils = buildUtils(vaultRoot, "assets-without-black-theme");
        const resolved = resolveAsset(
            withCssExtension(DEFAULT_SETTINGS.theme),
            utils.getThemeSearchPath(),
            NodeFsAssetLookup,
        );

        expect(resolved).toBe(path.join(distTheme, "black.css"));
    });

    test("missing asset does not resolve", () => {
        const utils = buildUtils(vaultRoot, "assets");
        const resolved = resolveAsset(
            "missing.css",
            utils.getLocalCssSearchPath(),
            NodeFsAssetLookup,
        );

        expect(resolved).toBeNull();
    });
});

describe("resolveDeckRelativeAsset against a real deck directory", () => {
    // Mirrors a deck at vaultRoot/talks/my-talk.md: deckDir is the deck's own
    // directory, and assetsDir is a separate, unrelated assetsDirectory-shaped
    // fixture used to prove there's no fallback from one to the other.
    let vaultRoot: string;
    let deckDir: string;
    let assetsDir: string;
    let assetsCss: string;

    beforeAll(() => {
        vaultRoot = mkdtempSync(path.join(tmpdir(), "slides-extended-deck-"));
        deckDir = path.join(vaultRoot, "talks");
        assetsDir = path.join(vaultRoot, "assets");
        assetsCss = path.join(assetsDir, "css");

        mkdirSync(path.join(deckDir, "nested"), { recursive: true });
        mkdirSync(assetsCss, { recursive: true });
        mkdirSync(path.join(assetsDir, "js"), { recursive: true });

        writeFileSync(path.join(deckDir, "local.css"), "deck-relative");
        writeFileSync(path.join(deckDir, "nested", "local.css"), "nested");
        writeFileSync(path.join(deckDir, "my-theme.css"), "theme");
        writeFileSync(path.join(deckDir, "local.js"), "");
        writeFileSync(path.join(deckDir, "my-highlight.css"), "highlight");
        writeFileSync(path.join(deckDir, "a.js"), "");

        // Same-named file under assetsDirectory, used only to prove the
        // no-fallback guarantee - it must never be picked up for a
        // "./missing.css" deck-relative reference.
        writeFileSync(
            path.join(assetsCss, "missing.css"),
            "should-not-be-used",
        );
        writeFileSync(path.join(assetsCss, "custom.css"), "");
        writeFileSync(path.join(assetsDir, "js", "b.js"), "");
    });

    afterAll(() => {
        rmSync(vaultRoot, { recursive: true, force: true });
    });

    test("./local.css resolves against the deck's own directory (css)", () => {
        const resolved = resolveDeckRelativeAsset(
            "./local.css",
            deckDir,
            NodeFsAssetLookup,
        );

        expect(resolved).toBe(path.join(deckDir, "local.css"));
    });

    test("./nested/local.css resolves against a subdirectory of the deck", () => {
        const resolved = resolveDeckRelativeAsset(
            "./nested/local.css",
            deckDir,
            NodeFsAssetLookup,
        );

        expect(resolved).toBe(path.join(deckDir, "nested", "local.css"));
    });

    test("./my-theme.css resolves against the deck's own directory (theme)", () => {
        const resolved = resolveDeckRelativeAsset(
            withCssExtension("./my-theme.css"),
            deckDir,
            NodeFsAssetLookup,
        );

        expect(resolved).toBe(path.join(deckDir, "my-theme.css"));
    });

    test("./local.js resolves against the deck's own directory (script)", () => {
        const resolved = resolveDeckRelativeAsset(
            "./local.js",
            deckDir,
            NodeFsAssetLookup,
        );

        expect(resolved).toBe(path.join(deckDir, "local.js"));
    });

    test("./my-highlight.css resolves against the deck's own directory (highlight theme)", () => {
        const resolved = resolveDeckRelativeAsset(
            withCssExtension("./my-highlight.css"),
            deckDir,
            NodeFsAssetLookup,
        );

        expect(resolved).toBe(path.join(deckDir, "my-highlight.css"));
    });

    test("./missing.css does not resolve even though a same-named file exists under assetsDirectory", () => {
        const resolved = resolveDeckRelativeAsset(
            "./missing.css",
            deckDir,
            NodeFsAssetLookup,
        );

        expect(resolved).toBeNull();

        // Confirm the same-named file genuinely exists under assetsDirectory
        // via the unrelated resolveAsset path - proving this isn't a miss
        // because the fixture is wrong, but because there is no fallback.
        const utils = buildUtils(vaultRoot, "assets");
        const viaAssetsDirectory = resolveAsset(
            "missing.css",
            utils.getLocalCssSearchPath(),
            NodeFsAssetLookup,
        );
        expect(viaAssetsDirectory).toBe(path.join(assetsCss, "missing.css"));
    });

    test("./../shared/local.css is rejected by the traversal guard regardless of whether the target exists", () => {
        const sharedDir = path.join(vaultRoot, "shared");
        mkdirSync(sharedDir, { recursive: true });
        writeFileSync(path.join(sharedDir, "local.css"), "shared");

        const resolved = resolveDeckRelativeAsset(
            "./../shared/local.css",
            deckDir,
            NodeFsAssetLookup,
        );

        expect(resolved).toBeNull();
    });

    test("./sub/../local.css is rejected for containing a '..' segment even though it net-normalizes into the deck directory", () => {
        const resolved = resolveDeckRelativeAsset(
            "./sub/../local.css",
            deckDir,
            NodeFsAssetLookup,
        );

        expect(resolved).toBeNull();
    });

    test("a non-./-prefixed value in the same fixture tree still resolves via assetsDirectory, unaffected by deck-relative resolution", () => {
        const utils = buildUtils(vaultRoot, "assets");
        const resolved = resolveAsset(
            "custom.css",
            utils.getLocalCssSearchPath(),
            NodeFsAssetLookup,
        );

        expect(resolved).toBe(path.join(assetsCss, "custom.css"));
    });

    test("a list mixing ./-prefixed and assetsDirectory-relative entries resolves each independently", () => {
        // getAssetPaths/findAsset in RevealRenderer aren't directly testable
        // here (RevealRenderer can't be imported under Jest - see header
        // comment), so this documents the per-entry behavior a real
        // `scripts: [./a.js, b.js]` list would produce by exercising each
        // entry's resolution mechanism separately, rather than through the
        // actual list-processing loop.
        const deckRelativeEntry = resolveDeckRelativeAsset(
            "./a.js",
            deckDir,
            NodeFsAssetLookup,
        );
        expect(deckRelativeEntry).toBe(path.join(deckDir, "a.js"));

        const utils = buildUtils(vaultRoot, "assets");
        const assetsDirectoryEntry = resolveAsset(
            "b.js",
            utils.getScriptSearchPath(),
            NodeFsAssetLookup,
        );
        expect(assetsDirectoryEntry).toBe(path.join(assetsDir, "js", "b.js"));
    });
});
