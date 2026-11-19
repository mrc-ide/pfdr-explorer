import { readdir } from "fs/promises";
import { join } from "node:path";
import config from "./config.ts";

export const adminLevels = ["0", "1", "2"];

const staveFiles = await readdir(join(config.dataDir, "stave"), { withFileTypes: true });
export const dataVersions = staveFiles
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name);

const modelFiles = await readdir(join(config.dataDir, "model"), { withFileTypes: true });
export const modelVersions = modelFiles
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name);
