import { MarkdownProcessor } from '../src/obsidian/markdownProcessor';
import { restoreFencedCode } from '../src/obsidian/fencedCode';
import { when } from 'ts-mockito';
import { MockedObsidianUtils, obsidianUtils as utilsInstance } from './__mocks__/mockObsidianUtils';
import { prepare } from './testUtils';
import { readFileSync } from 'node:fs';

test('Code Block Syntax > Code Blocks', () => {
	const input = `
\`\`\`dockerfile
FROM ubuntu
\`\`\`
`;

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(restoreFencedCode(sut.process(markdown, options))).toMatchSnapshot();
});

test('Code Block Syntax > Code Blocks with $ and underscores', () => {
	const input = `
\`\`\`dockerfile
USER $USER_NAME:$USER_NAME
\`\`\`
`;

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(restoreFencedCode(sut.process(markdown, options))).toMatchSnapshot();
});

test('Code Block Syntax > no type', () => {
	const input = `
\`\`\`
USER $USER_NAME:$USER_NAME
\`\`\`

The above does not show backticks
`;

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(restoreFencedCode(sut.process(markdown, options))).toMatchSnapshot();
});

test('Code Block Syntax > codeblock-ish, not math', () => {
	const input = `
 \`\`\`
USER $USER_NAME:$USER_NAME
\`\`\`

The above does not show backticks.
Underscores should not be escaped
`;

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(restoreFencedCode(sut.process(markdown, options))).toMatchSnapshot();
});

test('Code Block Syntax > Math with Code Blocks', () => {
	const input = readFileSync('test/fixtures/mathjax-codeblock.md', 'utf8');

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(restoreFencedCode(sut.process(markdown, options))).toMatchSnapshot();
});

test('Code Block Syntax > Math with Mixed Code Blocks', () => {
	const input = readFileSync('test/fixtures/mathjax-codeblock-mixed.md', 'utf8');

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(restoreFencedCode(sut.process(markdown, options))).toMatchSnapshot();
});

test('Embedded code has extra characters near dollar signs', () => {
	const input = readFileSync('test/fixtures/codeblock-with-math-chars.md', 'utf8');

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(restoreFencedCode(sut.process(markdown, options))).toMatchSnapshot();
});

test('Code Block Syntax > media reference in backtick fence is left verbatim', () => {
	const input = `
\`\`\`markdown
![Example](figs/nonexistent.svg)
![[nonexistent.png]]
\`\`\`
`;

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(restoreFencedCode(sut.process(markdown, options))).toMatchSnapshot();
});

test('Code Block Syntax > media reference in tilde fence is left verbatim', () => {
	const input = `
~~~markdown
![Example](figs/nonexistent.svg)
![[nonexistent.png]]
~~~
`;

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(restoreFencedCode(sut.process(markdown, options))).toMatchSnapshot();
});

test('Code Block Syntax > ::: block syntax in backtick fence is left verbatim', () => {
	const input = `
\`\`\`markdown
::: {.callout-note}
Note content
:::
\`\`\`
`;

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(restoreFencedCode(sut.process(markdown, options))).toMatchSnapshot();
});

test('Code Block Syntax > ::: block syntax in tilde fence is left verbatim', () => {
	const input = `
~~~markdown
::: {.callout-note}
Note content
:::
~~~
`;

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(restoreFencedCode(sut.process(markdown, options))).toMatchSnapshot();
});

test('Code Block Syntax > real media and ::: block still transform alongside fenced examples', () => {
	const input = `
![Real image](https://picsum.photos/id/1005/250/250)

::: block
Real block
:::

\`\`\`markdown
![Example](figs/nonexistent.svg)
::: {.callout-note}
Note content
:::
\`\`\`
`;

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(restoreFencedCode(sut.process(markdown, options))).toMatchSnapshot();
});

test('Code Block Syntax > fence introduced via embedded file is still protected', () => {
	const embeddedContent = readFileSync('test/fixtures/embedded-fenced-code.md', 'utf8');
	when(MockedObsidianUtils.parseFile('embedded-fenced-code.md', null)).thenCall(arg => {
		return embeddedContent;
	});

	const input = `
Top-level content before the embed.

![[embedded-fenced-code]]

Top-level content after the embed.
`;

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(restoreFencedCode(sut.process(markdown, options))).toMatchSnapshot();
});
