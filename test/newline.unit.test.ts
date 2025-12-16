
import { MarkdownProcessor } from 'src/obsidian/markdownProcessor';
import { obsidianUtils as utilsInstance } from './__mocks__/mockObsidianUtils';
import { prepare } from './testUtils';

test('Newline Preservation Check - Expect Visual Break', () => {
    const input = `Line 1
Line 2`;
    const { options, markdown } = prepare(input);
    const sut = new MarkdownProcessor(utilsInstance);
    const result = sut.process(markdown, options);
    
    // We expect a visual break. This can be <br> OR two spaces followed by newline.
    expect(result).toMatch(/(<br\s*\/?>|  \n)/);
});
