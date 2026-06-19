import {
    existsSync,
    mkdirSync,
    readFileSync,
    renameSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import path from "node:path";
import JSZip from "@progress/jszip-esm";
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
        const distVersion = (JSON.parse(rawdata) as { version: string })
            .version;
        return distVersion !== this.plugin.manifest.version;
    }

    async extractZip(
        buffer: ArrayBuffer,
        writeFile: (dest: string, content: Uint8Array) => void,
    ): Promise<void> {
        const contents = await new JSZip().loadAsync(buffer);
        const writes: Promise<void>[] = [];
        for (const filename of Object.keys(contents.files)) {
            const entry = contents.file(filename);
            if (entry && !contents.files[filename].dir) {
                writes.push(
                    entry.async("uint8array").then((content) => {
                        writeFile(filename, content);
                    }),
                );
            }
        }
        await Promise.all(writes);
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

            const pluginDirectory = this.pluginDirectory;
            await this.extractZip(response.arrayBuffer, (filename, content) => {
                const dest = path.join(pluginDirectory, filename);
                mkdirSync(path.dirname(dest), { recursive: true });
                writeFileSync(dest, content);
            });

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
