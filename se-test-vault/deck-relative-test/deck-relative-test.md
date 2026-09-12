---
css:
- ./local.css
---

# Deck-Relative Assets Test

Verify that a `./`-prefixed CSS value resolves against this deck's own
directory (`deck-relative-test/`) instead of the vault's assets directory.

---

## Deck-Relative CSS

<div class="deck-relative-styled">

This text should be green and italic with a left border — `./local.css`
resolves to `deck-relative-test/local.css`, next to this markdown file, not
to `assets/css`.

</div>
