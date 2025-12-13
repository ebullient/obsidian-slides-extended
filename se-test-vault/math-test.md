---
frontmatter: go
---

## Math

$$f'(x), \frac{dy}{dx},\dot{x}, y' ...$$

---

## Slide 1:  Test Formula

Different math rendering with and without show grid
- with grid: rendering like inline formula
- without grid: rendering like block  
    (position of $t \to \infty$ changes)

$$\lim_{t \to \infty} (w(t) - y(t)) = 0$$

---

<!-- slide template="[[template_formula]]" -->

## Slide 2: Test Equation with Templates

- Test equation-template
- Formula is rendered as inline-formula independent of grid on/off settings like (like

::: formula
$$\lim_{t \to \infty} (w(t) - y(t)) = 0$$
:::

---

## Tests of Inline Math

Problems with inline code  `$ ... $`

$\begin{vmatrix}a&b&c\\ d&e&f\\ g&h&i\end{vmatrix}$

---

## Math-Codeblock

--


```javascript
export class CounterService {
  count$ = new BehaviorSubject(1000);

  double$ = this.count$.pipe(map((count) => count * 2));
  triple$ = this.count$.pipe(map((count) => count * 3));

  combined$ = combineLatest([this.double$, this.triple$]).pipe(
    map(([double, triple]) => double + triple)
  );

  over9000$ = this.combined$.pipe(map((combined) => combined > 9000));

  message$ = this.over9000$.pipe(
    map((over9000) => (over9000 ? "It's over 9000!" : "It's under 9000."))
  );
}
```

--

$$\begin{vmatrix}a & b\\
c & d
\end{vmatrix}=ad-bc$$

````md
```dockerfile
USER $USER_NAME:$USER_NAME
```
````

```dockerfile
USER $USER_NAME:$USER_NAME
```

You can also use inline syntax (`$s^{-2}_{n}\sum_{i=1}^{n}$`)
to do inline math like $s^{-2}_{n}\sum_{i=1}^{n}$

---
## Tests of Display Math

--

- `cases`, as mentioned in [Issue #43](https://github.com/ebullient/obsidian-slides-extended/issues/43)

```
$$
\begin{cases}
2x_1^2 + x_2^{2} \leq 10 \\
x_1 + 3x_2 \leq 15 \\
x_1, x_2 \geq 0
\end{cases}
$$
```
$$
\begin{cases}
2x_1^2 + x_2^{2} \leq 10 \\
x_1 + 3x_2 \leq 15 \\
x_1, x_2 \geq 0
\end{cases}
$$

--
-  Double slashes should produce a new line [Issue # #261](https://github.com/ebullient/obsidian-slides-extended/issues/261)

```
$$
\begin{align*}
	A &= B \\
	  &= C
\end{align*}
$$
```
$$
\begin{align*}
	A &= B \\
	  &= C
\end{align*}
$$

--

- Artificial extra empty lines should be produced for an even number of consecutive backslashes
```
$$
\begin{align*}
	A &= B \\\\
	  &= C \\\\\\
	  &= D
\end{align*}
$$
```
$$
\begin{align*}
	A &= B \\\\
	  &= C \\\\\\
	  &= D
\end{align*}
$$

--

- Matrix
$$
\begin{align*}
	A
	=
	\begin{pmatrix}  
		1 & 3\\
		a & c  
	\end{pmatrix}
\end{align*}
$$

--

- Equation Numbering
$$
\begin{align*}
\int_0^\infty
\mathrm{d} x \;
x^2
\tag{1}
\\
\int_0^\infty
\mathrm{d} x \;
x^3
\tag{2}
\end{align*}
$$

---

### Escape

$a_b,\; a\_b$

$$
\begin{gathered}
a_\text{b}  \quad
a\_\text{b} \quad
{a}         \quad
\{a\}       \quad
\Big\{
	a
\Big\}
\\
\{a\}\{b\}
\\
\% \& \_ \#
\\
a\;b\,c\!d
\end{gathered}
$$

---

### Mixed with markdown symbols

- This is not `~b~, *b*, _b_`, i.e., ~b~, *b*, _b_
$$
\begin{gathered}
a~~b~~c
\\
a~b~c
\\
a*b*c
\\
a**b**c
\\
a_{b_{c}}
\\
\_a\_
\end{gathered}
$$

---

## `\verb` and `texttt`
$$
\begin{gathered}
\_\_
\\
\texttt{\_\_init\_\_}
\\
\verb|__|
\\
\verb|__a__|
\end{gathered}
$$