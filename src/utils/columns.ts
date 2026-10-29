import { dataVersions, modelVersions, type AdminLevel } from "../constants.ts";
import { connection } from "../queryEngine.ts";
import { prevalencesParquet, surveyDataParquet } from "./data.ts";

// The columns of every parquet file are read once at startup, so that requested
// properties can be validated against the exact file that a request will query.

const readColumns = async (parquetPath: string): Promise<string[]> =>
  (await connection.runAndReadAll(`SELECT * FROM '${parquetPath}' LIMIT 0`)).columnNames();

// Keyed by data release.
export const surveyColumns: Record<string, string[]> = {};
for (const dataVersion of dataVersions) {
  surveyColumns[dataVersion] = await readColumns(surveyDataParquet(dataVersion));
}

// Keyed by model release, then admin level.
export const prevalenceColumns: Record<string, Record<AdminLevel, string[]>> = {};
for (const modelVersion of modelVersions) {
  prevalenceColumns[modelVersion] = {
    "0": await readColumns(prevalencesParquet(modelVersion, "0")),
    "1": await readColumns(prevalencesParquet(modelVersion, "1")),
    "2": await readColumns(prevalencesParquet(modelVersion, "2")),
  };
}
