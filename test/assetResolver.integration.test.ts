import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { FileSystemAdapter } from "obsidian";
import type { SlidesExtendedSettings } from "../src/@types";
import { ObsidianUtils } from "../src/obsidian/obsidianUtils";
import {
    NodeFsAssetLookup,
    resolveAsset,
    withCssExtension,
} from "../src/reveal/assetResolver";
import { DEFAULT_SETTINGS } from "../src/slidesExtended-constants";

// RevealRenderer.ts itself cannot be imported under Jest today: it
// transitively pulls in reveal.js's markdown.js, an ESM file Jest isn't
// configured to transform (pre-existing, unrelated to this change). Since
// RevealRenderer.findAsset is now a thin pass-through into resolveAsset,
// this test exercises the real wiring seam directly - real ObsidianUtils
// search-path getters feeding resolveAsset against a real temp-directory
// fixture - which is what would otherwise be verified through findAsset.
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
