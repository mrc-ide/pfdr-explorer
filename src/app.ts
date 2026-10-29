import express, { type Express, type Request, type Response } from 'express';
import { errorHandler } from './middlewares/errorHandler.ts';
import { modelVersions } from './constants.ts';
import { modelMetadata } from './utils/releases.ts';
import { executeParquetQuery, prevalencesParquet, surveyDataParquet } from './utils/data.ts';
import { getMutationsByGene, globalBounds } from './utils/metadata.ts';
import {
  metadataQuerySchema,
  prevalencesQuerySchema,
  requestSchemas,
  surveysQuerySchema,
} from './schemas/query.ts';

export const createApp = (): Express => {
  const app: Express = express();

  app.get('/schema', (_req: Request, res: Response) => {
    res.send(requestSchemas);
  });

  app.get('/metadata', async (req: Request, res: Response) => {
    const { model_release: modelVersion } = metadataQuerySchema.parse(req.query);
    const { data_release, shapefile_source } = modelMetadata[modelVersion];

    res.send({
      model_releases: modelVersions,
      prevalences: {
        version: modelVersion,
        dependencies: { data_release, shapefile_source },
        variants: await getMutationsByGene(modelVersion),
      },
      bounds: await globalBounds(modelVersion),
    });
  });

  app.get('/surveys', async (req: Request, res: Response) => {
    const query = surveysQuerySchema.parse(req.query);

    const surveyDataParquetPath = surveyDataParquet(query.data_release);
    const result = await executeParquetQuery(query, "/surveys", surveyDataParquetPath);

    res.type("json").send(result.getRowObjectsJson());
  });

  app.get('/prevalences', async (req: Request, res: Response) => {
    const query = prevalencesQuerySchema.parse(req.query);

    const prevalencesParquetPath = prevalencesParquet(query.model_release, query.admin_level);
    const result = await executeParquetQuery(query, "/prevalences", prevalencesParquetPath);

    res.type("json").send(result.getColumnsObjectJson());
  });

  app.use(errorHandler);

  return app;
};
