import { z } from 'zod';
import { adminLevels, dataVersions, modelVersions, PREVALENCE_COLUMNS, SURVEY_COLUMNS } from '../constants.ts';
import type { BoundingBox, Column } from '../types.ts';
import { prevalenceColumns, surveyColumns } from '../utils/columns.ts';
import { endpointConfigs } from '../utils/endpoints.ts';
import { defaultDataRelease, latestModelRelease } from '../utils/releases.ts';

// Cross-field checks only run once every field is individually valid.
const whenFieldsValid = { when: (payload: z.core.ParsePayload) => payload.issues.length === 0 };

const singleValue = (param: string) => z.string().min(1).refine(
  (value) => !value.includes(","),
  `Query parameter "${param}" must be a single string`,
);

// A list may be given as comma-separated values and/or as repeated parameters.
const list = z.union([z.string(), z.array(z.string())], {
  error: (issue) => `Invalid input: expected string or array of strings, received ${typeof issue.input}`,
})
  .transform((value) => [value].flat().flatMap((item) => item.split(",")));

// Requested properties are matched case-insensitively, and replaced with the canonical
// column name, so that only known-correct column names reach the SQL query.
const properties = (requestable: Column[]) => {
  const canonicalNames = new Map(requestable.map((column) => [column.toLowerCase(), column]));
  return list
    .transform((items) => items
      .filter((item) => item !== "")
      .map((item) => canonicalNames.get(item.toLowerCase()) ?? item))
    .pipe(z.array(z.enum(requestable)).min(1))
    .describe(
      "Columns to return, comma-separated or as repeated parameters (case-insensitive). " +
      "Which columns are available depends on the release (and for prevalences, the admin level).",
    );
};

const checkPropertiesAvailable = (
  requested: Column[],
  available: string[],
  ctx: z.RefinementCtx,
) => {
  const unavailable = requested.find((property) => !available.includes(property));
  if (unavailable) {
    ctx.addIssue({ code: "custom", path: ["properties"], message: `Invalid property requested: ${unavailable}` });
  }
};

const isoDate = z.iso.date().describe("YYYY-MM-DD");
const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).describe("YYYY-MM");

const isDateRangeOrdered = (query: { date_from?: string, date_to?: string }) =>
  !query.date_from || !query.date_to || query.date_from <= query.date_to;
const dateRangeOrderError = {
  message: "'date_from' cannot be later than 'date_to'.",
  path: ["date_from"],
  ...whenFieldsValid,
};

const modelRelease = z.enum(modelVersions).default(latestModelRelease)
  .describe("Defaults to the latest model release.");
const dataRelease = z.enum(dataVersions).default(defaultDataRelease)
  .describe("Defaults to the data release that the latest model release depends on.");

const bboxFormat = "Expected format: min_lng,min_lat,max_lng,max_lat";
const coordinate = /^-?\d+(\.\d+)?$/;

const bbox = list.transform((coords, ctx): BoundingBox => {
  const invalid = (message: string) => {
    ctx.addIssue({ code: "custom", message, input: coords });
    return z.NEVER;
  };
  if (coords.length !== 4 || !coords.every((coord) => coordinate.test(coord))) {
    return invalid(`Invalid bbox: ${coords.join(", ")}. ${bboxFormat}`);
  }
  const [minLng, minLat, maxLng, maxLat] = coords.map(Number);
  if ([minLat, maxLat].some((lat) => Math.abs(lat) > 90) || [minLng, maxLng].some((lng) => Math.abs(lng) > 180)) {
    return invalid(`Invalid bbox: ${coords.join(", ")}. Latitudes must be within ±90 and longitudes within ±180.`);
  }
  if (minLat > maxLat) {
    return invalid(`Invalid bbox: ${coords.join(", ")}. ${bboxFormat}`);
  }
  if (minLng > maxLng) {
    return invalid(`Bounding box should not cross antimeridian. ${bboxFormat}`);
  }
  return { minLng, minLat, maxLng, maxLat };
}).describe(bboxFormat);

export const metadataQuerySchema = z.object({
  model_release: modelRelease,
}).strict();

export const surveysQuerySchema = z.object({
  properties: properties(endpointConfigs["/surveys"].requestableProperties),
  [SURVEY_COLUMNS.GENE]: singleValue(SURVEY_COLUMNS.GENE),
  [SURVEY_COLUMNS.MUTATION]: singleValue(SURVEY_COLUMNS.MUTATION),
  [SURVEY_COLUMNS.SURVEY_ID]: singleValue(SURVEY_COLUMNS.SURVEY_ID).optional(),
  data_release: dataRelease,
  date_from: isoDate.optional(),
  date_to: isoDate.optional(),
  bbox: bbox.optional(),
}).strict()
  .refine(isDateRangeOrdered, dateRangeOrderError)
  .superRefine((query, ctx) => {
    checkPropertiesAvailable(query.properties, surveyColumns[query.data_release], ctx);
  }, whenFieldsValid);

const regionParams = [PREVALENCE_COLUMNS.ADMIN0, PREVALENCE_COLUMNS.ADMIN1, PREVALENCE_COLUMNS.ADMIN2] as const;

export const prevalencesQuerySchema = z.object({
  properties: properties(endpointConfigs["/prevalences"].requestableProperties),
  [PREVALENCE_COLUMNS.GENE]: singleValue(PREVALENCE_COLUMNS.GENE),
  [PREVALENCE_COLUMNS.MUTATION]: singleValue(PREVALENCE_COLUMNS.MUTATION),
  admin_level: z.enum(adminLevels),
  [PREVALENCE_COLUMNS.ADMIN0]: singleValue(PREVALENCE_COLUMNS.ADMIN0).optional(),
  [PREVALENCE_COLUMNS.ADMIN1]: singleValue(PREVALENCE_COLUMNS.ADMIN1).optional(),
  [PREVALENCE_COLUMNS.ADMIN2]: singleValue(PREVALENCE_COLUMNS.ADMIN2).optional(),
  model_release: modelRelease,
  [PREVALENCE_COLUMNS.DATE]: yearMonth.optional(),
  date_from: yearMonth.optional(),
  date_to: yearMonth.optional(),
}).strict()
  .refine(isDateRangeOrdered, dateRangeOrderError)
  .refine(
    // The index of each region parameter is its admin level.
    (query) => regionParams.every((param, level) => !query[param] || level <= Number(query.admin_level)),
    {
      message: "You cannot request results at a less granular level than that of the containing region.",
      path: ["admin_level"],
      ...whenFieldsValid,
    },
  )
  .superRefine((query, ctx) => {
    checkPropertiesAvailable(query.properties, prevalenceColumns[query.model_release][query.admin_level], ctx);
  }, whenFieldsValid);


// Static JSON Schemas describing the query parameters accepted by each endpoint, for clients to inspect.
// Cross-field checks (refinements) cannot be expressed in JSON Schema, so they are omitted.
export const requestSchemas = {
  "/metadata": z.toJSONSchema(metadataQuerySchema, { io: "input" }),
  "/surveys": z.toJSONSchema(surveysQuerySchema, { io: "input" }),
  "/prevalences": z.toJSONSchema(prevalencesQuerySchema, { io: "input" }),
};
