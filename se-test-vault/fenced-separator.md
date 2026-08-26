# Fenced Separator Inertness

Use this note to compare how the plugin renders `---`/`--` text inside a
fenced code block versus a genuine slide separator, with the default
separators (`---` horizontal, `--` vertical).

---

## Fenced horizontal separator should not split the slide

Point one

```yaml
---
key: value
---
```

Point two

(expect: this heading, "Point one", the fenced YAML block, and "Point two"
all on ONE slide — the fenced `---` lines must not create a slide boundary)

---

## Fenced vertical separator should not split the slide

Point one

```yaml
key: value
--
more: value
```

Point two

(expect: one slide — the fenced `--` line must not create a vertical
sub-slide boundary)

--

## Real separator elsewhere still splits, fence on the resulting slide does not

This slide is reached by a real vertical separator above.

```yaml
---
key: value
---
```

(expect: this is its own sub-slide, reached via the real `--` above; the
fenced `---` lines inside it do not create any further split)
