import type { SlidesExtendedSettings } from "./@types";
import {
    DEFAULT_SETTINGS,
    RESERVED_ASSET_DIRECTORY_NAMES,
} from "./slidesExtended-constants";

export function validateAssetsDirectory(value: string): string | null {
    if (!value) {
        return "Assets directory is required and cannot be empty.";
    }
    if (RESERVED_ASSET_DIRECTORY_NAMES.includes(value)) {
        return `"${value}" is reserved and cannot be used as the assets directory.`;
    }
    return null;
}

export interface MigrationResult {
    settings: SlidesExtendedSettings;
    migratedAssetsDirectory: boolean;
}

/**
 * Merges saved data onto DEFAULT_SETTINGS and migrates legacy/absent
 * assetsDirectory values to the new default, reporting whether that
 * migration happened so the caller can show a one-time Notice.
 */
export function migrateSettings(
    data: Partial<SlidesExtendedSettings & { themeDirectory?: string }> | null,
): MigrationResult {
    const settings = Object.assign(
        {},
        DEFAULT_SETTINGS,
        data,
    ) as SlidesExtendedSettings;

    if (data?.themeDirectory && !data?.assetsDirectory) {
        settings.assetsDirectory = data.themeDirectory;
    }

    const migratedAssetsDirectory =
        !data?.assetsDirectory && !data?.themeDirectory;
    if (migratedAssetsDirectory) {
        settings.assetsDirectory = DEFAULT_SETTINGS.assetsDirectory;
    }

    return { settings, migratedAssetsDirectory };
}
