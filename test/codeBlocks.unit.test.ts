import { MarkdownProcessor } from 'src/obsidian/markdownProcessor';
import { obsidianUtils as utilsInstance } from './__mocks__/mockObsidianUtils';
import { prepare } from './testUtils';

test('Basic Markdown Syntax > Code Blocks', () => {
	const input = `
\`\`\`dockerfile
FROM ubuntu
\`\`\`
`;

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(sut.process(markdown, options)).toMatchSnapshot();
});

test('Basic Markdown Syntax > Code Blocks with multiple $ characters', () => {
	const input = `
\`\`\`dockerfile
USER $USER_NAME:$USER_NAME
\`\`\`
`;

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(sut.process(markdown, options)).toMatchSnapshot();
});

test('Code Block Syntax > Headers', () => {
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

test('Code Block Syntax > Headers', () => {
	const input = ` \`\`\`
USER $USER_NAME:$USER_NAME
\`\`\`

The above does show backticks
`;

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(sut.process(markdown, options)).toMatchSnapshot();
});

test('Code Block Syntax > Headers', () => {
	const input = `\`\`\`
USER $USER_NAME:$USER_NAME
\`\`\`

The above does not show backticks
`;

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(sut.process(markdown, options)).toMatchSnapshot();
});

test('Basic Markdown Syntax > Math with Code Blocks', () => {
	const input = `$$\begin{vmatrix}a & b\\
c & d
\end{vmatrix}=ad-bc$$

\`\`\`dockerfile
USER $USER_NAME:$USER_NAME
\`\`\`

You can also do inline math like $s^{-2}_{n}sum_{i=1}^{n}$`;

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(sut.process(markdown, options)).toMatchSnapshot();
});

test('Basic Markdown Syntax > Math with Multiple Code Blocks', () => {
	const input = `$$\begin{vmatrix}a & b\\
c & d
end{vmatrix}=ad-bc$$

\`\`\`dockerfile
USER $USER_NAME:$USER_NAME
\`\`\`

You can also do inline math like $s^{-2}_{n}sum_{i=1}^{n}$

\`\`\`bash
eval "$(/home/$USER_NAME/.rbenv/bin/rbenv init -)"
\`\`\`

That was ruby, now we have javascript:

\`\`\`
console.log("Hello world!")
\`\`\`
`;

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(sut.process(markdown, options)).toMatchSnapshot();
});

