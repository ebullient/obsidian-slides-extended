---
title: "Slide Backgrounds"
description: ""
weight: 7
---

You can change the background by annotating the slide:

```md
<!-- slide bg="aquamarine" -->
## Slide with text based background

`bg` is shorthand for [`data-background`](https://revealjs.com/markdown/#slide-attributes)

---

<!-- slide bg="#ff0000" -->
## Slide with hex based background

`bg` is shorthand for [`data-background`](https://revealjs.com/markdown/#slide-attributes)

---

<!-- slide bg="rgb(70, 70, 255)" -->
## Slide with rgb based background

`bg` is shorthand for [`data-background`](https://revealjs.com/markdown/#slide-attributes)

---

<!-- slide bg="hsla(315, 100%, 50%, 1)" -->
## Slide with hsl based background

`bg` is shorthand for [`data-background`](https://revealjs.com/markdown/#slide-attributes)

---

# Slide without background

---

<!-- slide bg="https://picsum.photos/seed/picsum/800/600" -->
## Slide with image background

`bg` with a URL attribute is shorthand for [`data-background-image`](https://revealjs.com/backgrounds/#image-backgrounds)

---

<!-- slide bg="[[image.jpg]]" -->
## Slide with image background #2

`bg` with a URL attribute is shorthand for [`data-background-image`](https://revealjs.com/backgrounds/#image-backgrounds)

---

<!-- slide bg="https://picsum.photos/seed/picsum/800/600" data-background-opacity="0.5" -->
## with opacity

- `bg` with a URL attribute is shorthand for [`data-background-image`](https://revealjs.com/backgrounds/#image-backgrounds)
- 0.5 ≙ 50% opacity
```

<!-- --->

{{< revealjs theme="black" progress="true" controls="true" >}}

<!-- .slide: data-background="aquamarine" -->
## Slide with text based background

`bg` is shorthand for [`data-background-color`](https://revealjs.com/backgrounds/#color-backgrounds)

---

<!-- .slide: data-background="#ff0000" -->
## Slide with hex based background

`bg` is shorthand for [`data-background-color`](https://revealjs.com/backgrounds/#color-backgrounds)

---

<!-- .slide: data-background="rgb(70, 70, 255)" -->
## Slide with rgb based background

`bg` is shorthand for [`data-background-color`](https://revealjs.com/backgrounds/#color-backgrounds)

---

<!-- .slide: data-background="hsla(315, 100%, 50%, 1)" -->
## Slide with hsl based background

`bg` is shorthand for [`data-background-color`](https://revealjs.com/backgrounds/#color-backgrounds)

---

# Slide without background

---

<!-- .slide: data-background-image="https://picsum.photos/seed/picsum/800/600" -->
## Slide with image background

`bg` with a URL attribute is shorthand for [`data-background-image`](https://revealjs.com/backgrounds/#image-backgrounds)

---

<!-- .slide: data-background-image="https://picsum.photos/seed/picsum/800/600" -->
## Slide with image background #2

`bg` with a URL attribute is shorthand for [`data-background-image`](https://revealjs.com/backgrounds/#image-backgrounds)

---

<!-- .slide: data-background-image="https://picsum.photos/seed/picsum/800/600" data-background-opacity="0.5" -->
## with opacity

- `bg` with a URL attribute is shorthand for [`data-background-image`](https://revealjs.com/backgrounds/#image-backgrounds)
- 0.5 ≙ 50% opacity

{{</revealjs>}}

<!-- --->

## More slide options

See [reveal backgrounds](https://revealjs.com/backgrounds/)

## Changing the background for all slides

You can change the background of all slides by adding the following frontmatter:

```md
---
bg: red
---
```

```md
---
bg: '#ff0000'
---
```

```md
---
bg: rgb(70, 70, 255)
---
```

You can also set the background to transparent for all slides. This is especially useful if you want to use your slides as overlay source for OBS.

```md
---
bg: transparent
---
```

### See in action

<video controls width="320" height="240"><source src="https://cdn.discordapp.com/attachments/840286238928797736/1014391376248573952/slides-in-obs.mp4" type="video/mp4"></video>
