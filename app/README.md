# PfDR Explorer: the app

The React frontend. It loads data from the API in [`../api`](../api).

## Run it locally

Needs Node 24.22.1 or later (the version in `.nvmrc`); `npm` refuses older versions.

In one terminal, start the API with its test data (from `api/`; see its README). In another:

```
npm ci
npm run dev
```

Then open http://localhost:5173. Requests to `/api/...` are forwarded to the API on port 3000.

To try the components in `src/lib` by hand, open http://localhost:5173/showcase.html. It shows each one in its variants, sizes and states, and it's served in development only: `npm run build` leaves it out.

## The component library

`src/lib` is the code written to be reused by other apps, not only this one. It has three layers:
- `core/` (plain functions)
- `charm/` (**CHARM**, Charts, Hotspots And Region Maps which is the map and the trend chart, drawn with D3 so that any framework can use them, arriving with the map PRs)
- The react components on top, such as the buttons and selects.

So `charm/` already holds what every component reads, the theme's defaults in `defaults.css` and the internal constants (sizes, weights, spacing, timings) in `constants.css`. Nothing in `src/lib` imports app code. More in [`src/lib/README.md`](src/lib/README.md).

## Build

`npm run build` type-checks and writes the static site to `dist/`.

## Test it

The same checks CI runs:

```
npm run typecheck
npm run lint
npm test
npm run test:coverage
```

`npm run test:watch` re-runs the tests each time you save a file.
