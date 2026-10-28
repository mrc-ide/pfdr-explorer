# PfDR Explorer

A web app mapping antimalarial drug-resistance markers in Africa, from survey data and modelled prevalence.

| Folder | What it is |
|---|---|
| [`api/`](api/) | The read-only API serving survey points and model outputs. See [api/README.md](api/README.md) |
| [`app/`](app/) | The React frontend. See [app/README.md](app/README.md) |

Each folder is its own npm project: run `npm ci` and the other commands inside it. Node version: see `.nvmrc`.

## Run it with Docker

To run the app and the API together, with the API's test data, from the repository root:

```
docker compose up --build
```

Then open http://localhost:8080. `docker compose down` removes the containers when you're done.