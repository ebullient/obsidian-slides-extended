import {
    existsSync,
    mkdirSync,
    readFileSync,
    renameSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { requestUrl } from "obsidian";
import type { SlidesExtendedPlugin } from "./slidesExtended-Plugin";

export class SlidesExtendedDistribution {
    plugin: SlidesExtendedPlugin;
    pluginDirectory: string;
    distDirectory: string;

    constructor(plugin: SlidesExtendedPlugin) {
        this.plugin = plugin;
        this.pluginDirectory = this.plugin.obsidianUtils.pluginDirectory;
        this.distDirectory = this.plugin.obsidianUtils.distDirectory;
    }

    isOutdated(): boolean {
        return !existsSync(this.distDirectory) || this.isOldVersion();
    }

    isOldVersion(): boolean {
        const versionFile = path.join(this.pluginDirectory, "distVersion.json");
        if (!existsSync(versionFile)) {
            return true;
        }
        const rawdata = readFileSync(versionFile, { encoding: "utf-8" });
        const distVersion = JSON.parse(rawdata).version;
        return distVersion !== this.plugin.manifest.version;
    }

    async update() {
        const version = this.plugin.manifest.version;
        const downloadUrl = `https://github.com/ebullient/obsidian-slides-extended/releases/download/${version}/slides-extended.zip`;

        // Backup existing dist directory before attempting update
        // Use dist-backup instead of dist/.backup to avoid issues with trailing slashes
        const backupDir = path.join(this.pluginDirectory, "dist-backup");
        let didBackup = false;

        if (existsSync(this.distDirectory)) {
            console.debug(
                "Backing up existing distribution files before update",
            );
            // Remove any existing backup first
            if (existsSync(backupDir)) {
                rmSync(backupDir, { recursive: true, force: true });
            }
            renameSync(this.distDirectory, backupDir);
            didBackup = true;
        }

        try {
            const response = await requestUrl(downloadUrl);
            if (response.status !== 200) {
                throw new Error(
                    `Failed to download ${downloadUrl}: HTTP ${response.status}`,
                );
            }

            const zip = new JSZip();
            const contents = await zip.loadAsync(response.arrayBuffer);
            const pluginDirectory = this.pluginDirectory;

            for (const filename of Object.keys(contents.files)) {
                if (!contents.files[filename].dir) {
                    zip.file(filename)
                        .async("nodebuffer")
                        .then((content) => {
                            const dest = path.join(pluginDirectory, filename);
                            const dir = path.dirname(dest);
                            mkdirSync(dir, { recursive: true });
                            writeFileSync(dest, content);
                        });
                }
            }

            // Update successful, remove backup
            if (didBackup && existsSync(backupDir)) {
                console.debug("Update successful, removing backup");
                rmSync(backupDir, { recursive: true, force: true });
            }
        } catch (error) {
            console.error("Failed to update distribution files:", error);

            // Restore backup on failure
            if (didBackup && existsSync(backupDir)) {
                console.debug("Restoring backup due to update failure");
                // Remove partial update if it exists
                if (existsSync(this.distDirectory)) {
                    rmSync(this.distDirectory, {
                        recursive: true,
                        force: true,
                    });
                }
                renameSync(backupDir, this.distDirectory);
            }

            throw error;
        }
    }
}
