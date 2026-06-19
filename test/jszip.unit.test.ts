import JSZip from "@progress/jszip-esm";
import { SlidesExtendedDistribution } from "../src/slidesExtended-Distribution";

async function makeZipBuffer(files: Record<string, string>): Promise<ArrayBuffer> {
    const zip = new JSZip();
    for (const [name, content] of Object.entries(files)) {
        zip.file(name, content);
    }
    return zip.generateAsync({ type: "arraybuffer" });
}

function makeDistribution(): SlidesExtendedDistribution {
    return Object.create(SlidesExtendedDistribution.prototype) as SlidesExtendedDistribution;
}

test("JSZip: create zip, load from arraybuffer, read file as uint8array", async () => {
    const zip = new JSZip();
    zip.file("hello.txt", "hello world");
    zip.file("nested/foo.txt", "nested content");

    const buffer = await zip.generateAsync({ type: "arraybuffer" });
    expect(buffer).toBeInstanceOf(ArrayBuffer);

    const loaded = await new JSZip().loadAsync(buffer);

    const hello = await loaded.file("hello.txt")?.async("uint8array");
    expect(new TextDecoder().decode(hello)).toBe("hello world");

    const nested = await loaded.file("nested/foo.txt")?.async("uint8array");
    expect(new TextDecoder().decode(nested)).toBe("nested content");
});

test("JSZip: enumerate files and skip directories", async () => {
    const zip = new JSZip();
    zip.folder("dist");
    zip.file("dist/index.html", "<html/>");
    zip.file("dist/style.css", "body {}");

    const buffer = await zip.generateAsync({ type: "arraybuffer" });
    const loaded = await new JSZip().loadAsync(buffer);

    const files: string[] = [];
    for (const filename of Object.keys(loaded.files)) {
        if (!loaded.files[filename].dir) {
            files.push(filename);
        }
    }

    expect(files.sort()).toEqual(["dist/index.html", "dist/style.css"]);
});

test("extractZip: writes all non-directory entries via callback", async () => {
    const buffer = await makeZipBuffer({
        "dist/index.html": "<html/>",
        "dist/style.css": "body {}",
        "dist/plugin.js": "console.log('hi')",
    });

    const dist = makeDistribution();
    const written: Record<string, string> = {};
    await dist.extractZip(buffer, (filename, content) => {
        written[filename] = new TextDecoder().decode(content);
    });

    expect(written).toEqual({
        "dist/index.html": "<html/>",
        "dist/style.css": "body {}",
        "dist/plugin.js": "console.log('hi')",
    });
});

test("extractZip: skips directory entries", async () => {
    const zip = new JSZip();
    zip.folder("dist");
    zip.file("dist/index.html", "<html/>");

    const buffer = await zip.generateAsync({ type: "arraybuffer" });
    const dist = makeDistribution();
    const written: string[] = [];
    await dist.extractZip(buffer, (filename) => {
        written.push(filename);
    });

    expect(written).toEqual(["dist/index.html"]);
});
