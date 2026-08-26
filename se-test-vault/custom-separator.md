---
separator: \r?\nxxx\r?\n
---

## Page one

First page, custom slide separator

xxx

## Horizontal rule (not separator)

This should all be on the same slide

---

We've changed the slide separator

--

Vertical slide separator is unchanged

xxx

## Fenced custom separator should not split the slide

Point one

```text
xxx
```

Point two

(expect: this heading, "Point one", the fenced block, and "Point two" all
on ONE slide — the fenced `xxx` line must not create a slide boundary, even
though it exactly matches the configured custom separator)
