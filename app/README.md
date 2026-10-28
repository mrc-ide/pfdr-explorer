# PfDR Explorer: the app

The react frontend. It reads everything from the API in [`../api`](../api).

## Run it locally

Needs Node 24.22.1 or later (the version in `.nvmrc`); `npm` refuses older versions.

In one terminal, start the API with its test data (fromt `api/`; see its README). In another:

```
npm ci
npm run dev
```

Then open http://localhost:5173. Requests to `/api/...` are forwarded to the API on port 3000.

## Build

`npm run build` type-checks and writes the static site to `dist/`.