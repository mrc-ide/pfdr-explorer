# src/lib: reusable code

Code here is written to be reused by the PfDR Explorer and other apps in the future. This library consists of three layers, each only allowed to use the ones below it:

| Folder | What | May use |
|---|---|---|
| `core/` | Plain functions | Nothing else in `src` |
| `charm/` | **CHARM: Charts, Hotspots And Region Maps.** The map and the trend chart drawn with D3 | `core/` |
| `*.tsx` | Thin React wrappers around CHARM and the UI components | `core/`, `charm/` |

And **nothing here imports app code.** Anything specific to PfDR Explorer such as the markers, wording, thresholds and API calls comes in as props, state or options.

## Using CHARM from any framework

Each CHARM component is a class that draws into a given element. For example:

`new Thing(element, options)` then `update(state)` on data change, `resize()` on size change (usually automatic), and `destroy()` on page closure.

## Styling

Everything here works in any app without setup, while also ensuring that the default styles can't clash with the app's own CSS:

- **Class names.** The React components use CSS Modules, so their classes are unique. CHARM's plain stylesheets start every class with `charm-`
- **Custom properties.** The theme's start with ``--charm-`, and every one has a default in `charm/defaults.css` which each component imports. The library's own constants start with `--_charm-`, in `charm/constants.css` or at the top of the component's class. And they're all **internal** rather than part of the theme, so they can change in any release. `styles.test.ts` fails if a stylesheet here uses any other custom property, reads one that's declared nowhere, uses a raw colour anywehere but `defaults.css`, sizes anything in `px` beyond a 3 px line, or writes a number without a name.
- **The colours are yours, the proportions are CHARM's.** Colours and the font are properties you can set. Each component is drawn in `em` of its own text size, so it scales as a whole: pick `small`, `medium` or `large` with its `size` prop (87.5%, 100% and 112.5% of the mock-up's size, in `rem`, so it also follows the reader's text size). Text never goes below 14 px, so components whose text is 14 px already have no `small`

To theme it, set the properties in your own CSS: on `:root` for the whole page, or on any element for just what's inside it.

```css
:root {
  --charm-accent: #6A1B9A;
  --charm-accent-hover: #4A148C;
}
```

The defaults are declared under `:where(:root)`, which has no specificity, so yours win whichever stylesheet loads first. A dark mode is the same, inside `@media (prefers-color-scheme: dark)`. `charm/defaults.css` lists every property with its default.
