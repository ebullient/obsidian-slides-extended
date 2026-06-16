import esbuild from "esbuild";
import process from "node:process";
import { copy } from 'esbuild-plugin-copy';
import { sassPlugin } from 'esbuild-sass-plugin';

try { process.loadEnvFile(); } catch { /* no .env file */ }

const prod = (process.argv[2] === 'production');
const dir = process.env.OUTDIR ? process.env.OUTDIR : "./build";

const map = {
    'plugin/reveal.js-elapsed-time-bar/elapsed-time-bar.js': 'plugin/elapsed-time-bar/elapsed-time-bar',
    'plugin/load-mathjax.js': 'plugin/load-mathjax',
    'plugin/obsidian-markdown.js': 'plugin/obsidian-markdown',
};

const entryPoints = Object.entries(map)
    .map(([k, v]) => ({ 'in': k, 'out': v }));

const parameters = {
    entryPoints,
    bundle: true,
    platform: 'browser',
    format: 'esm',
    minify: prod,
    target: 'es2022',
    logLevel: "info",
    sourcemap: prod ? false : 'inline',
    treeShaking: true,
    outdir: dir,
    plugins: [
        sassPlugin({
            filter: /.(s[ac]ss|css)$/,
            loadPaths: [
                'node_modules/reveal.js/css',
            ],
        }),
        copy({
            assets: {
                from: ['node_modules/reveal.js/dist/**/*'],
                to: ['./dist/'],
            }
        }),
        copy({
            assets: {
                from: ['node_modules/reveal.js/css/**/*'],
                to: ['./dist/css/'],
                keepStructure: true
            }
        }),
        copy({
            assets: {
                from: ['node_modules/highlight.js/styles/vs2015.css'],
                to: ['./plugin/highlight/'],
            }
        }),
        copy({
            assets: {
                from: ['node_modules/@fortawesome/fontawesome-free/js/all.min.js'],
                to: ['./dist/fontawesome/'],
            }
        }),
        copy({
            assets: {
                from: [
                    'node_modules/reveal.js/plugin/**/*',
                ],
                to: ['./plugin/'],
                keepStructure: true
            }
        }),
        copy({
            assets: {
                from: ['node_modules/reveal.js-plugins/chalkboard/**/*'],
                to: ['./plugin/chalkboard/'],
            }
        }),
        copy({
            assets: {
                from: ['node_modules/chart.js/dist/chart.umd.js'],
                to: ['./plugin/chart/'],
            }
        }),
        copy({
            assets: {
                from: ['node_modules/reveal.js-plugins/chart/*'],
                to: ['./plugin/chart/'],
            }
        }),
        copy({
            assets: {
                from: ['node_modules/reveal.js-plugins/customcontrols/*'],
                to: ['./plugin/customcontrols/'],
                keepStructure: true
            }
        }),
        copy({
            assets: {
                from: ['node_modules/reveal.js-plugins/audio-slideshow/plugin.js',
                       'node_modules/reveal.js-plugins/audio-slideshow/recorder.js'],
                to: ['./plugin/audio-slideshow/'],
            }
        }),
        copy({
            assets: {
                from: ['node_modules/mathjax/**/*'],
                to: ['./plugin/math/mathjax/'],
            }
        }),
        copy({
            assets: {
                from: ['node_modules/katex/dist/**/*'],
                to: ['./plugin/math/katex/dist/'],
                keepStructure: true,
            }
        }),
        copy({
            assets: {
                from: ['node_modules/reveal.js-menu/*'],
                to: ['./plugin/menu/'],
            }
        }),
        copy({
            assets: {
                from: ['node_modules/reveal.js-mermaid-plugin/plugin/mermaid/*'],
                to: ['./plugin/mermaid/'],
            }
        }),
        copy({
            assets: {
                from: [
                    'node_modules/reveal.js-pointer/dist/pointer.js',
                    'node_modules/reveal.js-pointer/dist/pointer.css',
                ],
                to: ['./plugin/reveal-pointer/'],
            }
        }),
        copy({
            assets: {
                from: ['template/**/*'],
                to: ['./template/'],
            }
        }),
    ],
};

if (prod) {
    await esbuild.build(parameters).catch((x) => {
        if (x.errors) {
            console.error(x.errors);
        } else {
            console.error(x);
        }
        process.exit(1)
    });
} else {
    const ctx = await esbuild.context(parameters);
    await ctx.watch();
}
