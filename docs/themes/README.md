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

	---
	theme: night

	---

## Custom themes

Open the settings for Slides Extended Plugin, and choose a folder to use as your "Theme Directory".
When trying to find themes, it will look here first. 

- The theme suggester will list themes in from (a) your configured theme directory,
  (b) `.obsidian/plugins/slides-extended/css` and (c) `.obsidian/plugins/slides-extended/dist/theme`.

Please keep your customized themes in this directory; do not directly edit themes in the plugin directory, as the changes are easily lost across devices or if the plugin is uninstalled.

- Name your theme uniquely. 
- If want to reference pre-packaged fonts or @import from a prepackaged theme, use `/dist/theme/...` as the starting path.

**Example:** 

If you create a directory in your vault called `assets/slides`, and create a 
CSS file called **my-theme.css** in that directory:

1. Open settings for Slides Extended Plugin, and choose `assets/themes` as the "Theme Directory"
2. You should be able to select `my-theme.css` as the default theme in slide settings (suggester)
3. Alternatively, you can specify the theme as a property in your slides markdown file: 

	---
	theme: my-theme.css

	---

## Remote themes

You can also load a custom theme directly from the Internet:

	---
	theme: https://revealjs-themes.dzello.com/css/theme/robot-lung.css

	---

## Highlight Themes

All you have learned so far about custom themes could be applied to highlight themes as well. Highlight Themes define how codeblock elements should look. 
To activate a highlight theme simply add a highlightTheme property in the frontmatter section of your slides:

	---
	highlightTheme: monokai

	---

By default Slides Extended comes with a variety of different highlight themes:

- zenburn (default)
- monokai
- vs2015

### Custom Highlight Theme

To define a custom highlight theme, add a CSS file containing `highlight` or `hljs` in the name into your 
Custom Theme directory (like `assets/themes` from the previous section).
