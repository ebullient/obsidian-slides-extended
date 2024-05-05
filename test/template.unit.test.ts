import { MarkdownProcessor } from 'src/obsidian/markdownProcessor';
import { when } from 'ts-mockito';
import { prepare } from './testUtils';
import { MockedObsidianUtils, obsidianUtils as utilsInstance } from './__mocks__/mockObsidianUtils';

test('Template only with content', () => {

    when(MockedObsidianUtils.parseFile('template.md', null)).thenCall(arg => {
        return `
        # Before
        <% content %>
        # After
        `;
    });

    const input = `<!-- slide template="[[template]]" -->

    # MyContent
`;

    const { options, markdown } = prepare(input);
    const sut = new MarkdownProcessor(utilsInstance);

    const result = JSON.stringify(sut.process(markdown, options));
    return expect(result).toMatchSnapshot();
});

test('Template with variable not set', () => {

    when(MockedObsidianUtils.parseFile('template.md', null)).thenCall(arg => {
        return `
    <% content %>
    # After<grid drag="100 6" drop="bottom">
    <% footer %>
    </grid>
    `;
    });

    const input = `<!-- slide template="[[template]]" -->

    # MyContent
`;

    const { options, markdown } = prepare(input);
    const sut = new MarkdownProcessor(utilsInstance);

    const result = JSON.stringify(sut.process(markdown, options));
    return expect(result).toMatchSnapshot();
});

test('Template with invisible variable not set', () => {

    when(MockedObsidianUtils.parseFile('template.md', null)).thenCall(arg => {
        return `
        <% content %>
        # After<grid drag="100 6" drop="bottom">
        <%? footer %>
        </grid>
        `;
    });

    const input = `<!-- slide template="[[template]]" -->

    # MyContent
`;

    const { options, markdown } = prepare(input);
    const sut = new MarkdownProcessor(utilsInstance);

    const result = JSON.stringify(sut.process(markdown, options));
    return expect(result).toMatchSnapshot();
});

test('Template with variable set', () => {

    when(MockedObsidianUtils.parseFile('template.md', null)).thenCall(arg => {
        return `
        <% content %>
        # After<grid drag="100 6" drop="bottom">
        <% footer %>
        </grid>
        `;
    });

    const input = `<!-- slide template="[[template]]" -->

# MyContent

::: footer
# Hello
:::

`;

    const { options, markdown } = prepare(input);
    const sut = new MarkdownProcessor(utilsInstance);

    const result = JSON.stringify(sut.process(markdown, options));
    return expect(result).toMatchSnapshot();
});

test('Template with variable in frontmatter', () => {

    when(MockedObsidianUtils.parseFile('template.md', null)).thenCall(arg => {
        return `
    <% content %>
    # After<grid drag="100 6" drop="bottom">
    <% footer %>
    </grid>
    `;
    });

    const input = `---
footer: "### And then..."
---

<!-- slide template="[[template]]" -->

# MyContent
`;

    const { options, markdown } = prepare(input);
    const sut = new MarkdownProcessor(utilsInstance);

    const result = JSON.stringify(sut.process(markdown, options));
    return expect(result).toMatchSnapshot();
});
