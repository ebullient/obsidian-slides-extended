import Fastify, { type FastifyInstance } from "fastify";

import { Buffer } from "node:buffer";
import { existsSync } from "node:fs";
import path from "node:path";
import { type ListDir, type ListFile, fastifyStatic } from "@fastify/static";
import { Notice, Platform, type TAbstractFile } from "obsidian";
import type { QueryString } from "../@types";
import type { ObsidianUtils } from "../obsidian/obsidianUtils";
import { RevealRenderer } from "./revealRenderer";

export class RevealServer {
    private _server: FastifyInstance;
    private readonly _port: number;
    private readonly _url: URL;
    private _revealRenderer: RevealRenderer;
    private filePath: string;

    constructor(utils: ObsidianUtils, port: number, url: URL) {
        this._port = port;
        this._url = url;
        this._revealRenderer = new RevealRenderer(utils);
        this.filePath = null;

        this._server = Fastify({});
        this._server.register(fastifyStatic, {
            root: utils.vaultDirectory,
            decorateReply: true,
            serve: false,
        });

        this._server.get<{ Querystring: QueryString }>(
            "/",
            async (request, reply) => {
                if (this.filePath === null) {
                    reply.type("text/html").send(chooseSlides);
                } else {
                    const markup = await this._revealRenderer.renderFile(
                        this.filePath,
                        request.query,
                    );
                    reply.type("text/html").send(markup);
                }
                return reply;
            },
        );

        for (const dir of ["plugin", "dist", "css"]) {
            this._server.register(fastifyStatic, {
                root: path.join(utils.pluginDirectory, dir),
                prefix: `/${dir}`,
                wildcard: true,
                index: false,
                decorateReply: false,
                list: {
                    format: "html",
                    render: renderIndex,
                },
            });
        }

        this._server.get<{ Querystring: QueryString }>(
            "/*",
            async (request, reply) => {
                // @ts-ignore
                const file = request.params["*"];

                const renderMarkdownFile = async (filePath: string) => {
                    const markup = await this._revealRenderer.renderFile(
                        filePath,
                        request.query,
                    );
                    reply.type("text/html").send(markup);
                };

                if (file.startsWith("local-file-url")) {
                    const urlpath = file.replace(
                        "local-file-url",
                        Platform.resourcePathPrefix,
                    );
                    const result = await fetch(urlpath).catch((error) => {
                        return new Response(null, {
                            status: 404,
                            statusText: error.messge,
                        });
                    });
                    if (result.ok) {
                        if (result.blob) {
                            const blob = await result.blob();
                            const bytes = await blob.arrayBuffer();
                            reply.type(blob.type).send(Buffer.from(bytes));
                        } else {
                            console.info(
                                "open a bug to handle this kind of response. Include this message",
                                result,
                            );
                        }
                    } else {
                        reply.code(404).send(result.statusText);
                    }
                } else if (file.startsWith("embed/") && file.endsWith(".md")) {
                    const filePath = path.join(
                        utils.vaultDirectory,
                        file.replace("embed/", ""),
                    );
                    await renderMarkdownFile(filePath);
                } else if (file.endsWith(".md")) {
                    // top-level slide
                    this.filePath = path.join(utils.vaultDirectory, file);
                    await renderMarkdownFile(this.filePath);
                } else {
                    let fetch = file;
                    const sourceDir = path.dirname(this.filePath);
                    if (sourceDir !== utils.vaultDirectory) {
                        const srcPath = path.join(sourceDir, file);
                        if (existsSync(srcPath)) {
                            fetch = srcPath.replace(utils.vaultDirectory, "");
                        }
                    }
                    console.debug(
                        "serve file",
                        file,
                        sourceDir,
                        utils.vaultDirectory,
                        fetch,
                    );
                    reply.sendFile(fetch);
                }
                return reply;
            },
        );
    }

    get running(): boolean {
        return !!this._server.addresses().slice(-1).pop();
    }

    getTargetUrl(target: TAbstractFile): URL {
        const url = this._url;
        url.pathname = this.fixedEncodeURIComponent(target.path);
        return url;
    }

    private fixedEncodeURIComponent(str: string) {
        return str.replace(
            /[!'()*]/g,
            (c) => `%${c.charCodeAt(0).toString(16)}`,
        );
    }

    async start() {
        if (this.running) {
            console.debug(
                "Slides Extended server is already running",
                this._server.listeningOrigin.replace(
                    /(127\.0\.0\.1|\[::1\])/,
                    "localhost",
                ),
            );
            return;
        }
        try {
            await this._server.listen({ host: "localhost", port: this._port });
            console.info(
                "Slides Extended is ready to go.",
                this._server.listeningOrigin.replace(
                    /(127\.0\.0\.1|\[::1\])/,
                    "localhost",
                ),
            );
        } catch (err) {
            new Notice(
                `Unable to start server. Is ${this._port} already in use?`,
            );
            console.error("Unable to start server", err);
        }
    }

    async stop() {
        if (this.running) {
            console.info("stopping Slides Extended server", this.running);
            await this._server.close();
        } else {
            console.debug("Slides Extended server is not running");
        }
    }
}

const chooseSlides = `
<html lang='en'><body>
<p>Open Presentation Preview in Obsidian first</p>
</body></html>`;

const renderIndex = (dirs: ListDir[], files: ListFile[]) => {
    return `
<html lang='en'><body>
<ul>
  ${dirs.map((dir) => `<li><a href="${dir.href}">${dir.name}</a></li>`).join("\n  ")}
</ul>
<ul>
  ${files.map((file) => `<li><a href="${file.href}" target="_blank">${file.name}</a></li>`).join("\n  ")}
</ul>
</body></html>`;
};
