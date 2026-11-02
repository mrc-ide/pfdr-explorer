# PfDR Explorer

A web app mapping antimalarial drug-resistance markers in Africa, from survey data and modelled prevalence.

| Folder | What it is |
|---|---|
| [`api/`](api/) | The read-only API serving survey points and model outputs. See [api/README.md](api/README.md) |
| [`app/`](app/) | The React frontend. See [app/README.md](app/README.md) |

Each folder is its own npm project: run `npm ci` and the other commands inside it.

## Prerequisites
- **Node 24.22.1 or later**, the version in `api/.nvmrc` and `app/.nvmrc` (CI checks they match). `npm` refuses older versions
- **Docker**, with Compose (`docker compose`), only to run both together as below

## Run it with Docker

To run the app and the API together from the repository root. The API serves its test data, the small set committed in `api/tests/fixtures/data`, so there's nothing to generate first. (For the full example data, see [First-time development set-up](api/README.md#first-time-development-set-up) in the API's README.)

```
docker compose up --build
```

Then open http://localhost:8080. `docker compose down` removes the containers when you're done.
