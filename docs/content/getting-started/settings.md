---
title: "Settings"
description: ""
weight: 2
pre: "<i class='fa fa-gears' style='margin-right:5px' ></i> "
---

The settings can be found under Slides Extended Section inside Plugin Settings. The settings can be found by clicking the gear in the bottom left corner, or by hitting `Ctrl/Cmd-,`.

Most of them are fairly self-explanatory, but here are some notes that might be helpful.

<!--more-->

### Port

Define on which Port Slides Extended should run. The default Port is `3000`.
Changing the port can be useful if you operate multiple vaults and both have Slides Extended plugin installed.

### Assets directory

Specify a vault directory for custom themes, CSS, scripts, and HTML templates. This is required and defaults to `assets`; it cannot be set to `css`, `dist`, or `plugin`, since those names collide with the plugin's own bundled directories. The plugin searches for files in organized subdirectories:

- **CSS/Themes**: `assets/css/`
- **Scripts**: `assets/js/`
- **HTML templates**: `assets/html/`

See [Themes](../themes/) for details on custom themes and CSS, including the new `scripts` and `remoteScripts` options.

`css`, `scripts`, `theme`, and `highlightTheme` also accept a `./`-prefixed value (e.g. `css: ./local.css`) to load a file from the same directory as the current slide deck instead of the assets directory. This deck-relative form never falls back to the assets directory and does not allow `../` traversal — see [Themes](../themes/) for details.

### Scripts and Remote Scripts

Load additional JavaScript into all presentations. These can be set globally in plugin settings (comma-separated) or per-note via YAML frontmatter. See [Themes](../themes/) for usage details.

## First Steps

[Follow instructions here](firstSteps.md)
