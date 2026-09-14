---
title: "Themes"
description: ""
weight: 6
alwaysopen: false
pre: "<i class='fa fa-paint-brush' ></i> "
---

Slides Extended comes with a variety of different themes built in:

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

Open the settings for Slides Extended Plugin, and choose a folder to use as your "Assets directory".
This directory is used to find custom themes, CSS, scripts, and HTML templates.

When the assets directory is set (e.g., `assets`), the plugin searches for CSS/theme files in:

1. `assets/css/`
2. `.obsidian/plugins/slides-extended/css`
3. `.obsidian/plugins/slides-extended/dist/theme`

Please keep your customized themes in your assets directory. Do not directly edit themes in the plugin directory, as the changes are easily lost across devices or if the plugin is uninstalled.

> [!TIP]
> - Name your theme uniquely.
> - If want to reference pre-packaged fonts or @import from a prepackaged theme, use `/dist/theme/...` as the starting path.

**Example:**

1. Create a directory in your vault called `assets/css`
2. Create a CSS file called **my-theme.css** in that directory
3. Open settings for Slides Extended Plugin, and choose `assets` as the "Assets directory"
4. You should be able to select `my-theme.css` as the default theme in slide settings (suggester)
5. Alternatively, you can specify the theme as a property in your slides markdown file:

```md
---
theme: my-theme.css
---
```

You can also reference a theme file that lives next to the deck's own markdown file, using the [deck-relative](#deck-relative-assets) `./` prefix:

```md
---
theme: ./my-theme.css
---
```

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

Add custom highlight themes as css files containing `highlight` or `hljs` in the name to your assets directory (e.g., `assets/css`).

For example, if you create `assets/css/github.highlight.css` with a github highlight theme, specify it in your frontmatter:

```md
---
highlightTheme: github.highlight.css
---
```

You can also reference a custom highlight theme file that lives next to the deck's own markdown file, using the [deck-relative](#deck-relative-assets) `./` prefix:

```md
---
highlightTheme: ./github.highlight.css
---
```

## Additional CSS snippets

You can add additional CSS files to your presentation. Place them in the `css/` subdirectory of your assets directory (e.g., `assets/css`) or use a [deck-relative](#deck-relative-assets) path:

```md
---
css:
  - my-talk.css
  - css/extra.css
  - ./local.css
---
```

A redundant `css/` prefix is tolerated.

## Custom Scripts

You can inject custom JavaScript into your presentations. Place them in the `js/` subdirectory of your assets directory (e.g., `assets/js`) or use a [deck-relative](#deck-relative-assets) path:

```md
---
scripts:
  - my-plugin.js
  - ./local-plugin.js
remoteScripts:
  - https://d3js.org/d3.v7.min.js
---
```

- `scripts` — local script files resolved from your assets directory or using a [deck-relative](#deck-relative-assets) path.
- `remoteScripts` — external script URLs loaded directly

Scripts are loaded after all built-in Reveal.js plugins but before `Reveal.initialize()`, so custom scripts can define new Reveal.js plugins.

Both `scripts` and `remoteScripts` can also be configured globally in the plugin settings, applying to all presentations.

## Deck-relative assets

Any of `css`, `scripts`, `theme`, or `highlightTheme` resources can be prefixed with `./` to load a file that lives next to the deck's own markdown file, instead of your assets directory:

```md
---
css:
  - ./local.css
  - ./nested/other.css
scripts:
  - ./deck-local.js
---
```

This resolves only against the current slide deck's own directory, or a subdirectory beneath it — there is **no** fallback to the assets directory, even if a same-named file exists there. Traversal to the parent directory (`../`) is not allowed.
