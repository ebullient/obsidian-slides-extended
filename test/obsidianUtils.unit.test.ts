import path from "node:path";
import { FileSystemAdapter } from "obsidian";
import type { SlidesExtendedSettings } from "../src/@types";
import { ObsidianUtils } from "../src/obsidian/obsidianUtils";
import { DEFAULT_SETTINGS } from "../src/slidesExtended-constants";

function fakeApp(vaultBasePath: string) {
    const adapter = new FileSystemAdapter();
    adapter.getBasePath = () => vaultBasePath;

    return {
        vault: {
            adapter,
            configDir: ".obsidian",
            getFiles: (): unknown[] => [],
        },
    } as unknown as import("obsidian").App;
}

function buildUtils(settings: Partial<SlidesExtendedSettings> = {}) {
    const app = fakeApp(path.join("vaultRoot"));
    const merged = Object.assign({}, DEFAULT_SETTINGS, settings);
    return new ObsidianUtils(app, merged);
}

test("ObsidianUtils > search paths put the vault assets subfolder ahead of plugin/bundled fallbacks, with no untyped assets-root entry", () => {
    const utils = buildUtils({ assetsDirectory: "assets" });
    const assetsDir = path.join(utils.vaultDirectory, "assets");
    const assetsCss = path.join(assetsDir, "css");
    const assetsJs = path.join(assetsDir, "js");

    expect(utils.getLocalCssSearchPath()[0]).toBe(assetsCss);
    expect(utils.getThemeSearchPath()[0]).toBe(assetsCss);
    expect(utils.getHighlightSearchPath()[0]).toBe(assetsCss);
    expect(utils.getScriptSearchPath()[0]).toBe(assetsJs);

    expect(utils.getLocalCssSearchPath()).not.toContain(assetsDir);
    expect(utils.getThemeSearchPath()).not.toContain(assetsDir);
    expect(utils.getHighlightSearchPath()).not.toContain(assetsDir);
    expect(utils.getScriptSearchPath()).not.toContain(assetsDir);
});

test("ObsidianUtils > css and theme search paths share the same plugin-relative shape", () => {
    const utils = buildUtils({ assetsDirectory: "assets" });
    const pluginCss = path.join(utils.pluginDirectory, "css");

    expect(utils.getLocalCssSearchPath()).toContain(pluginCss);
    expect(utils.getThemeSearchPath()).toContain(pluginCss);
});

test("ObsidianUtils > without an assetsDirectory, fallback search paths are unchanged", () => {
    const utils = buildUtils({ assetsDirectory: "" });
    const pluginCss = path.join(utils.pluginDirectory, "css");
    const distTheme = path.join(utils.distDirectory, "theme");

    expect(utils.getLocalCssSearchPath()).toEqual([pluginCss]);
    expect(utils.getThemeSearchPath()).toEqual([pluginCss, distTheme]);
});
