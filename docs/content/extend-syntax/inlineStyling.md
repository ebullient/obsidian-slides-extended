---
title: "Inline Styling"
description: ""
weight: 6
---

you may define css styles inside your markdown:


### by using the \<style\> compoment

```md
<style>
	.with-border{
		border: 1px solid red;
	}
</style>

styled text <!-- element class="with-border" -->
```

{{<revealjs theme="black" progress="true" controls="true">}}

<section>
<p style="border: 1px solid red;">styled text <!-- --></p>
</section>

{{</revealjs>}}

### by including them through css file

it is possible to add further css files beside theme and highlight theme to slide deck:

```md
---
css: [css/layout.css,css/customFonts.css]
---
```

These files will be found relative to either the configured custom Theme Directory or 
the Slides Extended plugin folder.
