---
frontmatter: go
theme: beige.css
---

# Fenced Code In Lists

Use this note to compare how Obsidian renders explicit fenced code blocks
inside list items versus plain indented code.

---

## Baseline fenced block in a list item

1. First item
2. Second item with a fenced block:

   ```js
   const answer = 42;
   console.log(answer);
   ```

3. Third item after the code block

---

## Plain indented code block, no fence markers

This should remain an indented code block example, not an explicit fence case.

1. First item
2. Second item with plain indented code:

       const answer = 42;
       console.log(answer);

3. Third item after the code block

---

## Nested fence content should stay inert

1. First item
2. Second item with a longer tilde fence containing backticks:

   ~~~~
   ```js
   const nested = "literal";
   ```
   ~~~~

3. Third item after the code block
