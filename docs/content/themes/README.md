---
title: "Themes"
description: ""
weight: 6
alwaysopen: false
pre: "<i class='fa fa-paint-brush' ></i> "
---

Slides Extended comes with a varity of diffrent themes built in:

- black (default)
- white
- league
- beige
- sky
- night
- serif
- simple
- solarized
- blood
- moon
- consult
- mattropolis

The source for these built in themes is found in `.obsidian/plugins/slides-extended/dist/theme`

To activate a theme simply add a theme property in the frontmatter section of your slides:

```md
---
theme: night
---
```

## Custom themes

Open the settings for Slides Extended Plugin, and choose a folder to use as your "Theme Directory".
When trying to find themes, it will look here first.

- The theme suggester will list themes in from:
    - your configured theme directory,
    - `.obsidian/plugins/slides-extended/css` and
    - `.obsidian/plugins/slides-extended/dist/theme`.

Please keep your customized themes in your configured theme directory. Do not directly edit themes in the plugin directory, as the changes are easily lost across devices or if the plugin is uninstalled.

> [!TIP]
> - Name your theme uniquely. 
> - If want to reference pre-packaged fonts or @import from a prepackaged theme, use `/dist/theme/...` as the starting path.

**Example:**

1. Create a directory in your vault called `assets/css`
2. Create a CSS file called **my-theme.css** in that directory:
3. Open settings for Slides Extended Plugin, and choose `assets/css` as the "Theme Directory"
4. You should be able to select `my-theme.css` as the default theme in slide settings (suggester)
5. Alternatively, you can specify the theme as a property in your slides markdown file:

```md
---
theme: css/my-theme.css
---
```

> [!TIP]
> There is some weirdness here with regard to paths that is 
> leftover from Advanced Slides. The structure above
> (with the css root) works.

## Remote themes

You can also load a custom theme directly from the Internet:

```md
---
theme: https://revealjs-themes.dzello.com/css/theme/robot-lung.css
---
```

## Highlight Themes

All you have learned so far about custom themes could be applied to highlight themes as well. Highlight Themes define how codeblock elements should look. 
To activate a highlight theme simply add a highlightTheme property in the frontmatter section of your slides:

```md
---
highlightTheme: monokai
---
```

By default Slides Extended comes with a variety of different highlight themes built-in:

- zenburn (default)
- monokai
- vs2015

### Custom Highlight Theme

Add custom highlight themes as css files containing `highlight` or `hljs` in the name to your 
Custom Theme directory (like `assets/css` from the previous section).

For example, if you create `assets/css/github.highlight.css` with a github highlight theme, specify it in your frontmatter
this way:

```md
---
highlightTheme: css/github.css
---
```

## Additional CSS snippets

You can add additional css fragments similarly.

Assuming you've created a css file in `assets/css` (configured as your theme directory) called `my-talk.css`, add it to your presentation this way:

```md
---
css:
  - css/my-talk.css
---
```
