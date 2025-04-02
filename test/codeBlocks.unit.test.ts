import { MarkdownProcessor } from 'src/obsidian/markdownProcessor';
import { obsidianUtils as utilsInstance } from './__mocks__/mockObsidianUtils';
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

	return expect(sut.process(markdown, options)).toMatchSnapshot();
});

test('Code Block Syntax > Code Blocks with $ and underscores', () => {
	const input = `
\`\`\`dockerfile
USER $USER_NAME:$USER_NAME
\`\`\`
`;

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(sut.process(markdown, options)).toMatchSnapshot();
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

	return expect(sut.process(markdown, options)).toMatchSnapshot();
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

	return expect(sut.process(markdown, options)).toMatchSnapshot();
});

test('Code Block Syntax > Math with Code Blocks', () => {
	const input = readFileSync('test/fixtures/mathjax-codeblock.md', 'utf8');

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(sut.process(markdown, options)).toMatchSnapshot();
});

test('Code Block Syntax > Math with Mixed Code Blocks', () => {
	const input = readFileSync('test/fixtures/mathjax-codeblock-mixed.md', 'utf8');

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(sut.process(markdown, options)).toMatchSnapshot();
});

test('Embedded code has extra characters near dollar signs', () => {
	const input = readFileSync('test/fixtures/codeblock-with-math-chars.md', 'utf8');

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(sut.process(markdown, options)).toMatchSnapshot();
});

