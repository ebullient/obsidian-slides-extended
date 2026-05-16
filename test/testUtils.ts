import { load } from 'js-yaml';
import type { Options } from '../src/@types';

export function prepare(input: string): { options: Options; markdown: string } {
	const { yamlOptions, markdown } = parseYamlFrontMatter(input);
	const options = getSlideOptions(yamlOptions);
	return { options, markdown };
}

function parseYamlFrontMatter(input: string): {
	yamlOptions: any;
	markdown: string;
} {
	const stripped = input.replace(/^\uFEFF/, '');
	const match = /^---\r?\n([\w\W]+?)\r?\n---\r?\n?([\w\W]*)/.exec(stripped);
	if (!match) {
		return { yamlOptions: {}, markdown: stripped };
	}
	return {
		yamlOptions: (load(match[1]) as any) ?? {},
		markdown: match[2] || stripped,
	};
}

export function getSlideOptions(options: any): Options {
	return Object.assign({}, {
		theme: 'black',
		highlightTheme: 'zenburn',
		template: 'template/reveal.html',
		separator: '\r?\n---\r?\n',
		verticalSeparator: '\r?\n--\r?\n',
		enableLinks: false,
		width: 960,
		height: 700,
		margin: 0.04,
	}, options);
}
