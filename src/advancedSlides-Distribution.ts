import { existsSync, readFileSync } from 'fs-extra';
import path from 'path';
import { AdvancedSlidesPlugin } from './advancedSlides-Plugin';

export class AdvancedSlidesDistribution {
    plugin: AdvancedSlidesPlugin;

    constructor(plugin: AdvancedSlidesPlugin) {
        this.plugin = plugin;
    }

    isOutdated(): boolean {
        const pluginDirectory = this.plugin.obsidianUtils.pluginDirectory;
        const distDirectory = this.plugin.obsidianUtils.distDirectory;

        return !existsSync(distDirectory) || this.isOldVersion(pluginDirectory);
    }

    isOldVersion(dir: string) {
        const versionFile = path.join(dir, 'distVersion.json');
        if (!existsSync(versionFile)) {
            return true;
        } else {
            const rawdata = readFileSync(versionFile, { encoding: 'utf-8' });
            const distVersion = JSON.parse(rawdata).version;
            return distVersion != this.plugin.manifest.version;
        }
    }

    // async thing() {
    //     const version = this.plugin.manifest.version;
    //     const pluginDirectory = this.plugin.obsidianUtils.getPluginDirectory();
    //     const distDirectory = this.plugin.obsidianUtils.getDistDirectory();
    //
    //     if (!existsSync(distDirectory) || this.isOldVersion(pluginDirectory)) {
    //         //Download binary
    //         const downloadUrl = `https://github.com/MSzturc/obsidian-advanced-slides/releases/download/${version}/obsidian-advanced-slides.zip`;
    //
    //         const bufs: Uint8Array[] = [];
    //         let buf: Uint8Array;
    //         request
    //             .get(downloadUrl)
    //             .on('end', () => {
    //                 buf = Buffer.concat(bufs);
    //                 const zip = new JSZip();
    //                 zip
    //                     .loadAsync(buf)
    //                     .then(contents => {
    //                         Object.keys(contents.files).forEach(function(filename) {
    //                             if (!contents.files[filename].dir) {
    //                                 zip
    //                                     .file(filename)
    //                                     .async('nodebuffer')
    //                                     .then(function(content) {
    //                                         const dest = path.join(pluginDirectory, filename);
    //                                         outputFileSync(dest, content);
    //                                     });
    //                             }
    //                         });
    //                     })
    //                     .catch(error => {
    //                         console.log(error);
    //                     });
    //             })
    //             .on('error', error => {
    //                 console.log(error);
    //             })
    //             .on('data', d => {
    //                 // @ts-ignore
    //                 bufs.push(d);
    //             });
    //     }
    // }

    copyThemes(themeDirectory: string) {}
}
