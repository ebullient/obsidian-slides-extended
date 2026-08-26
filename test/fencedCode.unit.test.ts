import {
    protectFencedCode,
    restoreFencedCode,
} from "../src/obsidian/fencedCode";

test("Fenced Code Primitive > backtick fence round trip", () => {
    const input = "\n```dockerfile\nFROM ubuntu\n```\n";
    const protectedText = protectFencedCode(input);

    expect(protectedText).not.toContain("```");
    expect(restoreFencedCode(protectedText)).toBe(input);
});

test("Fenced Code Primitive > tilde fence round trip", () => {
    const input = "\n~~~yaml\nkey: value\n~~~\n";
    const protectedText = protectFencedCode(input);

    expect(protectedText).not.toContain("~~~");
    expect(restoreFencedCode(protectedText)).toBe(input);
});

test("Fenced Code Primitive > multiple fences, no cross-contamination", () => {
    const input = [
        "Point one",
        "",
        "```yaml",
        "key: value",
        "```",
        "",
        "Point two",
        "",
        "~~~js",
        "const x = 1;",
        "~~~",
        "",
        "Point three",
        "",
    ].join("\n");

    const protectedText = protectFencedCode(input);

    expect(protectedText).not.toContain("```");
    expect(protectedText).not.toContain("~~~");
    expect(restoreFencedCode(protectedText)).toBe(input);
});

test("Fenced Code Primitive > reserved wrapper text inside fenced content round trips", () => {
    const trickyContent = "FENCEDCODEabc123ECODDECNEF";
    const input = `\n\`\`\`\n${trickyContent}\n\`\`\`\n`;

    const protectedText = protectFencedCode(input);

    expect(protectedText).not.toContain(trickyContent);
    expect(restoreFencedCode(protectedText)).toBe(input);
});

test("Fenced Code Primitive > fence content containing default separator", () => {
    const input =
        "\nPoint one\n\n```yaml\n---\nkey: value\n---\n```\n\nPoint two\n";

    const protectedText = protectFencedCode(input);

    // The only remaining `---`-shaped text in the protected document must be
    // none: the fenced separators are hidden inside the placeholder, and the
    // placeholder itself introduces no new separator-matching text.
    expect(protectedText).not.toMatch(/\r?\n---\r?\n/);
    expect(protectedText).not.toMatch(/\r?\n--\r?\n/);
    expect(restoreFencedCode(protectedText)).toBe(input);
});

test("Fenced Code Primitive > fence content containing a custom separator", () => {
    const customSeparator = "===SLIDE===";
    const input = `\n\`\`\`text\n${customSeparator}\nmore text\n\`\`\`\n`;

    const protectedText = protectFencedCode(input);

    expect(protectedText).not.toContain(customSeparator);
    expect(restoreFencedCode(protectedText)).toBe(input);
});

test("Fenced Code Primitive > CRLF line endings", () => {
    const input = "\r\n```dockerfile\r\nFROM ubuntu\r\n```\r\n";

    const protectedText = protectFencedCode(input);

    expect(protectedText).not.toContain("```");
    expect(restoreFencedCode(protectedText)).toBe(input);
});

test("Fenced Code Primitive > unclosed fence at end of document", () => {
    const input = "\nBefore\n\n```dockerfile\nFROM ubuntu\nRUN something\n";

    const protectedText = protectFencedCode(input);

    expect(protectedText).not.toContain("```");
    expect(restoreFencedCode(protectedText)).toBe(input);
});

test("Fenced Code Primitive > protect called twice, restore called once", () => {
    const input =
        "\n```dockerfile\nFROM ubuntu\n```\n\nSome text\n\n~~~yaml\nkey: value\n~~~\n";

    const firstPass = protectFencedCode(input);
    const secondPass = protectFencedCode(firstPass);

    expect(secondPass).toBe(firstPass);
    expect(restoreFencedCode(secondPass)).toBe(input);
});

test("Fenced Code Primitive > indented block without fence delimiters is left untouched", () => {
    const input =
        "\nParagraph text\n\n    indented code\n    more indented code\n\nMore text\n";

    const protectedText = protectFencedCode(input);

    expect(protectedText).toBe(input);
});
