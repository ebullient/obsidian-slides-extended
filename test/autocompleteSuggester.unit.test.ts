import { AutoCompleteSuggest } from "src/obsidian/suggesters/AutoCompleteSuggester";

function makeEditor(line: string) {
    return {
        getLine: () => line,
        getRange: () => line,
    };
}

function makeWritableEditor(initialLine: string, cursorCh: number) {
    let currentLine = initialLine;
    return {
        getLine: () => currentLine,
        setLine: (_lineNum: number, text: string) => { currentLine = text; },
        setCursor: (_line: number, _ch: number) => {},
        getCursor: () => ({ line: 0, ch: cursorCh }),
        getRange: () => currentLine,
        get currentLine() { return currentLine; },
    };
}

function cur(ch: number) {
    return { line: 0, ch };
}

describe("AutoCompleteSuggest.onTrigger", () => {
    let suggest: AutoCompleteSuggest;

    beforeEach(() => {
        suggest = new AutoCompleteSuggest({} as any);
        suggest.activate();
    });

    test("returns null when inactive", () => {
        suggest.deactivate();
        expect(suggest.onTrigger(cur(5), makeEditor("hello world") as any, null)).toBeNull();
    });

    test("returns null for plain prose", () => {
        expect(suggest.onTrigger(cur(5), makeEditor("hello world") as any, null)).toBeNull();
    });

    test("returns null mid-word with no slide prefix", () => {
        expect(suggest.onTrigger(cur(3), makeEditor("foo bar") as any, null)).toBeNull();
    });

    test("returns null at start of empty line", () => {
        expect(suggest.onTrigger(cur(0), makeEditor("") as any, null)).toBeNull();
    });

    test("triggers when word starts with <", () => {
        expect(suggest.onTrigger(cur(4), makeEditor("<gri") as any, null)).not.toBeNull();
    });

    test("triggers when word starts with :::‌", () => {
        expect(suggest.onTrigger(cur(3), makeEditor(":::") as any, null)).not.toBeNull();
    });

    test("triggers inside <!-- slide tag", () => {
        const line = "<!-- slide ";
        expect(suggest.onTrigger(cur(line.length), makeEditor(line) as any, null)).not.toBeNull();
    });

    test("triggers inside <!-- element tag with attribute", () => {
        const line = '<!-- element class="';
        expect(suggest.onTrigger(cur(line.length), makeEditor(line) as any, null)).not.toBeNull();
    });
});

describe("AutoCompleteSuggest.getSuggestions", () => {
    let suggest: AutoCompleteSuggest;

    beforeEach(() => {
        suggest = new AutoCompleteSuggest({} as any);
        suggest.activate();
    });

    test("returns empty array when inactive", () => {
        suggest.deactivate();
        expect(suggest.getSuggestions({ query: "<grid" } as any)).toEqual([]);
    });

    test("returns empty array for empty query", () => {
        expect(suggest.getSuggestions({ query: "" } as any)).toEqual([]);
    });

    test("returns suggestions for < prefix", () => {
        const results = suggest.getSuggestions({ query: "<" } as any);
        expect(results.length).toBeGreaterThan(0);
    });

    test("filters suggestions by input", () => {
        const results = suggest.getSuggestions({ query: "<grid" } as any);
        expect(results.some(r => r.value.startsWith("<grid"))).toBe(true);
    });

    test("returns empty for closing tag", () => {
        expect(suggest.getSuggestions({ query: "</" } as any)).toEqual([]);
    });

    test("filters grid properties by partial name typed before =", () => {
        const line = "<grid dr";
        const query = JSON.stringify(suggest.getTag(line, line.length));
        const results = suggest.getSuggestions({ query } as any);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every(r => (r.value + (r.description ?? "")).toLowerCase().includes("dr"))).toBe(true);
        expect(results.some(r => r.value.startsWith('drag'))).toBe(true);
    });
});

describe("AutoCompleteSuggest.selectSuggestion", () => {
    let suggest: AutoCompleteSuggest;

    beforeEach(() => {
        suggest = new AutoCompleteSuggest({} as any);
        suggest.activate();
    });

    test("replaces partial property name without duplicating typed text", () => {
        // User typed '<grid dr' and accepts 'drag=""'
        const line = "<grid dr";
        const editor = makeWritableEditor(line, line.length);
        const cursor = { line: 0, ch: line.length };

        // Simulate what onTrigger sets as context
        (suggest as any).context = {
            editor,
            start: cursor,
            end: cursor,
            query: JSON.stringify(suggest.getTag(line, line.length)),
        };

        suggest.selectSuggestion(
            { value: 'drag=""', offset: 6 } as any,
            {} as any,
        );

        expect(editor.currentLine).toBe('<grid drag=""');
    });
});
