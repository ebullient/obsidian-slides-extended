import { DEFAULT_SETTINGS } from "../src/slidesExtended-constants";
import {
    migrateSettings,
    validateAssetsDirectory,
} from "../src/slidesExtended-SettingsData";

test("validateAssetsDirectory > rejects an empty value", () => {
    expect(validateAssetsDirectory("")).not.toBeNull();
});

test.each(["css", "dist", "plugin"])(
    "validateAssetsDirectory > rejects reserved name %s",
    (name) => {
        expect(validateAssetsDirectory(name)).not.toBeNull();
    },
);

test("validateAssetsDirectory > accepts a normal folder name", () => {
    expect(validateAssetsDirectory("assets")).toBeNull();
});

test("validateAssetsDirectory > reserved-name check is case-sensitive, so a differently-cased name is accepted", () => {
    expect(validateAssetsDirectory("Css")).toBeNull();
});

test("migrateSettings > absent assetsDirectory key migrates to the default", () => {
    const { settings, migratedAssetsDirectory } = migrateSettings(null);

    expect(settings.assetsDirectory).toBe(DEFAULT_SETTINGS.assetsDirectory);
    expect(migratedAssetsDirectory).toBe(true);
});

test("migrateSettings > empty saved assetsDirectory migrates to the default", () => {
    const { settings, migratedAssetsDirectory } = migrateSettings({
        assetsDirectory: "",
    });

    expect(settings.assetsDirectory).toBe(DEFAULT_SETTINGS.assetsDirectory);
    expect(migratedAssetsDirectory).toBe(true);
});

test("migrateSettings > explicit non-empty assetsDirectory is left unchanged, no migration flagged", () => {
    const { settings, migratedAssetsDirectory } = migrateSettings({
        assetsDirectory: "myassets",
    });

    expect(settings.assetsDirectory).toBe("myassets");
    expect(migratedAssetsDirectory).toBe(false);
});

test("migrateSettings > legacy themeDirectory is migrated to assetsDirectory when assetsDirectory is absent", () => {
    const { settings, migratedAssetsDirectory } = migrateSettings({
        themeDirectory: "oldThemes",
    });

    expect(settings.assetsDirectory).toBe("oldThemes");
    expect(migratedAssetsDirectory).toBe(false);
});

test("migrateSettings > legacy themeDirectory also wins when saved assetsDirectory is explicitly empty", () => {
    const { settings, migratedAssetsDirectory } = migrateSettings({
        themeDirectory: "oldThemes",
        assetsDirectory: "",
    });

    expect(settings.assetsDirectory).toBe("oldThemes");
    expect(migratedAssetsDirectory).toBe(false);
});
