import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { SlidesExtendedPlugin } from './slidesExtended-Plugin';
import JSZip from 'jszip';
import { requestUrl } from 'obsidian';

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
        const versionFile = path.join(this.pluginDirectory, 'distVersion.json');
        if (!existsSync(versionFile)) {
            return true;
        } else {
            const rawdata = readFileSync(versionFile, { encoding: 'utf-8' });
            const distVersion = JSON.parse(rawdata).version;
            return distVersion != this.plugin.manifest.version;
        }
    }

    async update() {
        const version = this.plugin.manifest.version;
        const downloadUrl = `https://github.com/ebullient/obsidian-slides-extended/releases/download/${version}/slides-extended.zip`;
        const response = await requestUrl(downloadUrl);
        if (response.status != 200) {
            console.error(`Failed to download ${downloadUrl}`);
            return;
        }

        const zip = new JSZip();
        const contents = await zip.loadAsync(response.arrayBuffer);
        const pluginDirectory = this.pluginDirectory;

        Object.keys(contents.files).forEach(function (filename) {
            if (!contents.files[filename].dir) {
                zip.file(filename)
                    .async('nodebuffer')
                    .then(function (content) {
                        const dest = path.join(pluginDirectory, filename);
                        const dir = path.dirname(dest);
                        mkdirSync(dir, { recursive: true });
                        writeFileSync(dest, content);
                    });
            }
        });
    }
}
