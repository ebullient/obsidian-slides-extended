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
\end{vmatrix}=ad-bc$$

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

test('Embedded code has extra characters near dollar signs', () => {
	const input = `
\`\`\`javascript
export class CounterService {
  count$ = new BehaviorSubject(1000);

  double$ = this.count$.pipe(map((count) => count * 2));
  triple$ = this.count$.pipe(map((count) => count * 3));

  combined$ = combineLatest([this.double$, this.triple$]).pipe(
    map(([double, triple]) => double + triple)
  );

  over9000$ = this.combined$.pipe(map((combined) => combined > 9000));

  message$ = this.over9000$.pipe(
    map((over9000) => (over9000 ? "It's over 9000!" : "It's under 9000."))
  );
}
\`\`\``;

	const { options, markdown } = prepare(input);
	const sut = new MarkdownProcessor(utilsInstance);

	return expect(sut.process(markdown, options)).toMatchSnapshot();
});

