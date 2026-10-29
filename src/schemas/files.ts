import { z } from 'zod';
import { dataVersions } from '../constants.ts';

export const ModelMetadataSchema = z.object({
  version: z.string().min(1),
  data_release: z.string().refine(
    (release) => dataVersions.includes(release),
    { error: (issue) => `Unknown data release: ${issue.input}` },
  ),
  shapefile_source: z.string().min(1),
});
export type ModelMetadata = z.infer<typeof ModelMetadataSchema>;

const CoordinatesSchema = z.object({ lat: z.number(), lng: z.number() });
const BoundsSchema = z.object({ min: CoordinatesSchema, max: CoordinatesSchema });
export type Bounds = z.infer<typeof BoundsSchema>;

// Grout's response includes other fields (e.g. name, geojson_properties), which are allowed but stripped.
export const Admin0RegionMetadataSchema = z.array(z.object({
  id: z.string().min(1),
  bounds: BoundsSchema,
}));

// Parse a JSON data file at startup, so that the server fails to start if the file is malformed.
export const parseJsonFile = <T extends z.ZodType>(schema: T, contents: string, path: string): z.output<T> => {
  const result = schema.safeParse(JSON.parse(contents));
  if (!result.success) {
    throw new Error(`Invalid data file ${path}:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
};
