import { emptyDir, copy, writeFile, existsSync } from 'fs-extra';
import path from 'path';
import { ObsidianUtils } from '../obsidian/obsidianUtils';

export class RevealExporter {
    private pluginDirectory: string;
    private exportDirectory: string;
    private vaultDirectory: string;

    constructor(utils: ObsidianUtils) {
        this.pluginDirectory = utils.pluginDirectory;
        this.exportDirectory = utils.exportDirectory;
        this.vaultDirectory = utils.vaultDirectory;
    }

    public async export(filePath: string, html: string, imgList: string[]) {
        const ext = path.extname(filePath);
        const folderName = path.basename(filePath).replaceAll(ext, '');
        const folderDir = path.join(this.exportDirectory, folderName);
        const sourceDir = path.dirname(filePath);
        const vaultDir = this.vaultDirectory.replace(/\/$/, '');

        console.debug('export', sourceDir, vaultDir, folderDir);

        await emptyDir(folderDir);
        await writeFile(path.join(folderDir, 'index.html'), html);

        // TODO: let's track what css, scripts, and plugins are actually used
        // rather than copying everything.
        await copy(
            path.join(this.pluginDirectory, 'css'),
            path.join(folderDir, 'css'),
        );
        await copy(
            path.join(this.pluginDirectory, 'dist'),
            path.join(folderDir, 'dist'),
        );
        await copy(
            path.join(this.pluginDirectory, 'plugin'),
            path.join(folderDir, 'plugin'),
        );

        for (const img of imgList) {
            if (img.startsWith('http')) {
                continue;
            }
            let imgPath = path.join(vaultDir, img);
            if (sourceDir !== vaultDir) {
                const relative = path.join(sourceDir, img);
                if (existsSync(relative)) {
                    imgPath = relative;
                }
            }
            console.debug('img', img, imgPath, sourceDir != vaultDir);
            await copy(imgPath, path.join(folderDir, img));
        }

        window.open('file://' + folderDir);
    }
}
