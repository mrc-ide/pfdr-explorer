import { readFile } from "node:fs/promises";
import semver from "semver";
import { join } from "node:path";
import config from "../config.ts";
import { modelVersions } from "../constants.ts";
import { ModelMetadataSchema, parseJsonFile, type ModelMetadata } from "../schemas/files.ts";

const readModelMetadata = async (modelVersion: string): Promise<ModelMetadata> => {
  const metadataPath = join(config.dataDir, "model", modelVersion, "metadata.json");
  return parseJsonFile(ModelMetadataSchema, await readFile(metadataPath, "utf8"), metadataPath);
};

// Read every model release's metadata at startup so that malformed files are caught early.
export const modelMetadata: Record<string, ModelMetadata> = {};
for (const modelVersion of modelVersions) {
  modelMetadata[modelVersion] = await readModelMetadata(modelVersion);
}

export const latestModelRelease = semver.rsort([...modelVersions])[0];

// Each model release depends on a specific data release, so the default data release
// is the one that the default model release depends on.
export const defaultDataRelease = modelMetadata[latestModelRelease].data_release;
