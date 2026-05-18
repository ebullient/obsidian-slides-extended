import { Buffer } from "node:buffer";
import path from "node:path";
import {
    copy,
    emptyDir,
    existsSync,
    outputFileSync,
    writeFile,
} from "fs-extra";
import { Platform, requestUrl } from "obsidian";
import type { ObsidianUtils } from "../obsidian/obsidianUtils";

export class RevealExporter {
    private pluginDirectory: string;
    private exportDirectory: string;
    private vaultDirectory: string;

    constructor(utils: ObsidianUtils) {
        this.pluginDirectory = utils.pluginDirectory;
        this.exportDirectory = utils.exportDirectory;
        this.vaultDirectory = utils.vaultDirectory;
    }

    public async export(
        filePath: string,
        html: string,
        imgList: string[],
        localAssetPaths: string[] = [],
    ) {
        const ext = path.extname(filePath);
        const folderName = path.basename(filePath).replaceAll(ext, "");
        const folderDir = path.join(this.exportDirectory, folderName);
        const sourceDir = path.dirname(filePath);
        const vaultDir = this.vaultDirectory.replace(/\/$/, "");

        console.debug("export", sourceDir, vaultDir, folderDir);

        await emptyDir(folderDir);
        await writeFile(path.join(folderDir, "index.html"), html);

        // TODO: let's track what css, scripts, and plugins are actually used
        // rather than copying everything.
        await copy(
            path.join(this.pluginDirectory, "css"),
            path.join(folderDir, "css"),
        );
        await copy(
            path.join(this.pluginDirectory, "dist"),
            path.join(folderDir, "dist"),
        );
        await copy(
            path.join(this.pluginDirectory, "plugin"),
            path.join(folderDir, "plugin"),
        );

        for (const img of imgList) {
            console.debug("export", img);
            if (img.startsWith("http")) {
                continue;
            }
            if (img.startsWith("/local-file-url")) {
                const urlpath = img.replace(
                    "/local-file-url",
                    Platform.resourcePathPrefix,
                );
                try {
                    const result = await requestUrl(urlpath);
                    if (result.status >= 200 && result.status < 300) {
                        outputFileSync(
                            path.join(folderDir, img),
                            Buffer.from(result.arrayBuffer),
                        );
                    } else {
                        console.error(
                            "Failed to fetch local file",
                            urlpath,
                            result.status,
                        );
                    }
                } catch (error) {
                    const msg =
                        error instanceof Error ? error.message : String(error);
                    console.error("Failed to fetch local file", urlpath, msg);
                }
                continue;
            }
            let imgPath = path.join(vaultDir, img);
            if (sourceDir !== vaultDir) {
                const relative = path.join(sourceDir, img);
                if (existsSync(relative)) {
                    imgPath = relative;
                }
            }
            console.debug("img", img, imgPath, sourceDir !== vaultDir);
            await copy(imgPath, path.join(folderDir, img));
        }

        for (const asset of localAssetPaths) {
            if (
                asset.startsWith("http") ||
                asset.startsWith("dist/") ||
                asset.startsWith("css/") ||
                asset.startsWith("plugin/")
            ) {
                continue;
            }
            let assetPath = path.join(vaultDir, asset);
            if (sourceDir !== vaultDir) {
                const relative = path.join(sourceDir, asset);
                if (existsSync(relative)) {
                    assetPath = relative;
                }
            }
            if (existsSync(assetPath)) {
                await copy(assetPath, path.join(folderDir, asset));
            }
        }

        window.open(`file://${folderDir}`);
    }
}
