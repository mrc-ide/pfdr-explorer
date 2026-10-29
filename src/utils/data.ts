import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { connection } from '../queryEngine.ts';
import config from '../config.ts';
import type { BoundingBox, Column } from '../types.ts';
import type { DuckDBResultReader } from '@duckdb/node-api';
import { SURVEY_COLUMNS } from '../constants.ts';
import { endpointConfigs, type Endpoint, type EndpointConfig } from './endpoints.ts';
import { Admin0RegionMetadataSchema, parseJsonFile } from '../schemas/files.ts';

export type { Bounds } from '../schemas/files.ts';

const admin0RegionMetadataPath = join(config.dataDir, "admin0-region-metadata.json");
export const admin0RegionMetadata = parseJsonFile(
  Admin0RegionMetadataSchema,
  await readFile(admin0RegionMetadataPath, "utf8"),
  admin0RegionMetadataPath,
);

// A validated, parsed request query (see src/schemas/query.ts).
export interface ParsedQuery {
  properties: Column[];
  bbox?: BoundingBox;
  [param: string]: string | Column[] | BoundingBox | undefined;
}

// Arbitrary alias for the parquet file in the SQL queries.
const tableName = "p";

// Build and run an SQL query out of the requested properties and filters.
export const executeParquetQuery = async (
  query: ParsedQuery,
  path: Endpoint,
  parquetPath: string,
): Promise<DuckDBResultReader> => {
  const config = endpointConfigs[path];

  const selectColumns = query.properties.map(p => `${tableName}.${p}`).join(", ");
  const { whereClause, bindings } = buildWhereClause(query, config);

  const sql = `SELECT ${selectColumns} FROM '${parquetPath}' ${tableName} ${whereClause}`;
  const statement = await connection.prepare(sql);

  statement.bind(bindings);
  const result = await statement.runAndReadAll();
  return result;
};

const buildWhereClause = (query: ParsedQuery, config: EndpointConfig): {
  whereClause: string
  bindings: Record<string, string>
} => {
  const whereClauses = [];
  const bindings: Record<string, string> = {}; // Map from param name to value for use in prepared statement.

  if (query.bbox) {
    whereClauses.push(buildBoundsClause(query.bbox));
  }

  for (const paramName of config.filterableParams) {
    const paramVal = query[paramName];
    if (typeof paramVal !== "string") continue;

    const column = ["date_from", "date_to"].includes(paramName) ? config.dateColumn : paramName;
    const comparison = paramName === "date_from" ? ">=" : paramName === "date_to" ? "<=" : "=";

    whereClauses.push(`${tableName}.${column} ${comparison} $${paramName}`);
    bindings[paramName] = paramVal;
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  return { whereClause, bindings };
};

// The bounding box has been validated as numbers, so may safely be interpolated into the SQL.
const buildBoundsClause = ({ minLng, minLat, maxLng, maxLat }: BoundingBox) => [
  `${tableName}.${SURVEY_COLUMNS.LAT} >= ${minLat}`,
  `${tableName}.${SURVEY_COLUMNS.LAT} <= ${maxLat}`,
  `${tableName}.${SURVEY_COLUMNS.LNG} >= ${minLng}`,
  `${tableName}.${SURVEY_COLUMNS.LNG} <= ${maxLng}`,
].join(" AND ");

export const prevalencesParquet = (modelVersion: string, adminLevel: string) =>
  join(config.dataDir, "model", modelVersion, `admin${adminLevel}.parquet`);

export const surveyDataParquet = (dataVersion: string) =>
  join(config.dataDir, "stave", dataVersion, "survey_data.parquet");
