---
title: "Mermaid"
description: ""
weight: 13
---

<!--more-->

````md
---
theme: beige
highlightTheme: css/vs2015.css
---

```mermaid
sequenceDiagram
    Alice->>+John: Hello John, how are you?
    Alice->>+John: John, can you hear me?
    John-->>-Alice: Hi Alice, I can hear you!
    John-->>-Alice: I feel great!
```
````

![Mermaid](../images/mermaid.png)

````md
---
theme: beige
highlightTheme: css/vs2015.css
---

## Gitgraph Diagrams support

```mermaid
    gitGraph
       commit
       commit
       branch develop
       checkout develop
       commit
       commit
       checkout main
       merge develop
       commit
       commit
```
````

![Gitgraph](../images/gitgraph.png)

## Mermaid Configuration

It's possible to overload the default mermaid configuration to change the behaviour / layout of the rendered mermaid diagrams using configuraton like this:

```yaml
mermaid:
  themeVariables:
    fontSize: 32px
  theme: 'forest'
```

To do so, add a mermaid property to frontmatter as follows:

```md
---
mermaid:
  themeVariables:
    fontSize: 32px
  theme: 'forest'
---
```

> [!TIP]
> Read more about mermaid configuration [here](https://mermaid-js.github.io/mermaid/#/Setup)
