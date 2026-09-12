---
theme: beige.css
css:
- css/custom.css
- custom2.css
scripts:
- custom.js
---

# Custom Assets Test

Verify that local CSS and JS are loaded.

---

## Custom CSS

<div class="custom-styled">

This text should be red and italic with a left border.

</div>

---

## Custom CSS 2

<div class="custom-styled-2">

This text should be blue and bold with a left border — `css/custom.css`
(redundant prefix) and `custom2.css` (minimal form) both resolve to the
same `assets/css` directory.

</div>

---

## Custom Script

<div class="scripted">

This element should have a `data-scripted` attribute added by custom.js.

</div>
