---
title: "Slides Extended Documentation"
description: ""
---
# Create Awesome Presentations in Obsidian


[Slides Extended](https://github.com/ebullient/obsidian-slides-extended) is an open source plugin for [Obsidian](https://obsidian.md/) that allows you to create [reveal.js](https://revealjs.com/) based presentations in Obsidian. With this tool anyone who is able to create a note in Obsidian can also create a beautiful presentation. 

> [!NOTE] 
> We follow the philosophy of `convention over configuration`.
> In most cases it is sufficient to simply write a Slide in **Obsidian Markdown syntax**.

## Main features

- Live Preview while editing your slides markdown
- Theme support for your slides
- Excalidraw Support
- Mermaid Support
- Block Support: `::: block`
- Obidian <-> Reveal.js integration
    - Footnote Support: `Here's a footnote[^1]`
    - Pass options To Slide Compiler through frontmatter (properties)
    - Support for wiki links
        - `[[Note]]` will be rendered as normal text in Presentation
        - with aliases `[[Note|My Note]]`
    - Obsidian embed Support: `![[Note.md#FirstChapter]]` or `![First Chapter](Note.md#FirstChapter)`
    - Image Support: `![[picture.jpg]]` or `![](picture.jpg)`
        - pipe image properties: `![[image.png|100x100]]` or `![|100x100](image.png)`
    - See [Extended Syntax](/docs/extend-syntax/) for more
- Reveal.js Markdown features
    - Define stylesheets inside Markdown: `<style>....</style>` d
    - Annotate elements: `<!-- element class="red" -->`

## Call for Help

You have coding skills and you are missing a proper Slides functionality as much as me and want to help? Join us, there is enough work to do.

## Contribute to this documentation

Feel free to update this content, just click the **Improve this page** link displayed on top right of each page, and pullrequest it

Your modification will be deployed automatically when merged!
