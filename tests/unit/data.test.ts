import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executeParquetQuery } from '../../src/utils/data.ts';
import { prevalencesQuerySchema } from '../../src/schemas/query.ts';
import { PREVALENCE_COLUMNS, SURVEY_COLUMNS } from '../../src/constants.ts';
import fixtureConfig from '../fixtures/fixture-config.json' with { type: 'json' };

// The columns of each parquet file are read when the query schemas are first imported,
// before `beforeEach` runs, so the mock needs a default implementation from the outset.
const db = vi.hoisted(() => {
  const columns = [
    'admin0',
    'admin1',
    'gene',
    'mutation',
    'date',
    'collection_day',
    'median',
    'SD',
    'no_of_informing_surveys',
    'survey_id',
    'lat',
    'lng',
  ];

  return {
    bind: vi.fn(),
    prepare: vi.fn(),
    runAndReadAll: vi.fn(async () => ({ columnNames: () => columns })),
  };
});

vi.mock('../../src/queryEngine.ts', () => ({
  connection: {
    prepare: db.prepare,
    runAndReadAll: db.runAndReadAll,
  }
}));

const admin1ParquetPath = `tests/fixtures/data/model/${fixtureConfig.modelRelease}/admin1.parquet`;
const surveyPath = `tests/fixtures/data/stave/${fixtureConfig.dataRelease}/survey_data.parquet`;

beforeEach(() => {
  vi.clearAllMocks();
  db.prepare.mockResolvedValue(db);
});

describe('executeParquetQuery SQL generation', () => {
  it('uses equality filters and SQL parameter bindings', async () => {
    await executeParquetQuery(
      {
        properties: [PREVALENCE_COLUMNS.ADMIN1, PREVALENCE_COLUMNS.MEDIAN],
        gene: 'crt',
        mutation: '76K',
        date: '2024-05',
      },
      '/prevalences',
      admin1ParquetPath,
    );

    expect(db.prepare).toHaveBeenCalledWith(
      `SELECT p.admin1, p.median FROM '${admin1ParquetPath}' p ` +
      'WHERE p.gene = $gene AND p.mutation = $mutation AND p.date = $date',
    );
    expect(db.bind).toHaveBeenCalledWith({
      gene: 'crt',
      mutation: '76K',
      date: '2024-05',
    });
  });

  it('maps date ranges to the `date` column for the prevalences endpoint, using inequality operators', async () => {
    await executeParquetQuery(
      {
        properties: [PREVALENCE_COLUMNS.ADMIN1],
        date_from: '2023-05',
        date_to: '2025-05',
      },
      '/prevalences',
      admin1ParquetPath,
    );

    expect(db.prepare).toHaveBeenCalledWith(
      `SELECT p.admin1 FROM '${admin1ParquetPath}' p ` +
      'WHERE p.date >= $date_from AND p.date <= $date_to',
    );
    expect(db.bind).toHaveBeenCalledWith({
      date_from: '2023-05',
      date_to: '2025-05',
    });
  });

  it('maps date ranges to the `collection_day` column for the surveys endpoint, using inequality operators', async () => {
    await executeParquetQuery(
      {
        properties: [SURVEY_COLUMNS.GENE],
        date_from: '2023-05-01',
        date_to: '2025-05-01',
      },
      '/surveys',
      surveyPath,
    );

    expect(db.prepare).toHaveBeenCalledWith(
      `SELECT p.gene FROM '${surveyPath}' p ` +
      'WHERE p.collection_day >= $date_from AND p.collection_day <= $date_to',
    );
    expect(db.bind).toHaveBeenCalledWith({
      date_from: '2023-05-01',
      date_to: '2025-05-01',
    });
  });

  it('filters prevalence admin0 using the parquet column', async () => {
    await executeParquetQuery(
      { properties: [PREVALENCE_COLUMNS.ADMIN1], admin0: 'MLI' },
      '/prevalences',
      admin1ParquetPath,
    );

    expect(db.prepare).toHaveBeenCalledWith(
      `SELECT p.admin1 FROM '${admin1ParquetPath}' p WHERE p.admin0 = $admin0`,
    );
    expect(db.bind).toHaveBeenCalledWith({ admin0: 'MLI' });
  });

  it('filters survey data using latitude and longitude bounds', async () => {
    await executeParquetQuery(
      {
        properties: [SURVEY_COLUMNS.SURVEY_ID],
        bbox: { minLng: -12.2389, minLat: 10.1595, maxLng: 0, maxLat: 25 },
        date_from: '2010-01-01',
        date_to: '2010-02-01',
      },
      '/surveys',
      surveyPath,
    );

    expect(db.prepare).toHaveBeenCalledWith(
      `SELECT p.survey_id FROM '${surveyPath}' p WHERE ` +
      'p.lat >= 10.1595 AND p.lat <= 25 AND p.lng >= -12.2389 AND p.lng <= 0 ' +
      'AND p.collection_day >= $date_from AND p.collection_day <= $date_to',
    );
    expect(db.bind).toHaveBeenCalledWith({
      date_from: '2010-01-01',
      date_to: '2010-02-01',
    });
  });

  it('omits WHERE when no filterable parameters are provided', async () => {
    await executeParquetQuery(
      { properties: [PREVALENCE_COLUMNS.ADMIN1] },
      '/prevalences',
      admin1ParquetPath,
    );

    expect(db.prepare).toHaveBeenCalledWith(
      `SELECT p.admin1 FROM '${admin1ParquetPath}' p `,
    );
    expect(db.bind).toHaveBeenCalledWith({});
  });

  it('selects the canonical column name for a property requested in a different case', async () => {
    const query = prevalencesQuerySchema.parse({
      properties: 'sd,MEDIAN',
      gene: 'crt',
      mutation: '76K',
      admin_level: '1',
    });

    await executeParquetQuery(query, '/prevalences', admin1ParquetPath);

    expect(db.prepare).toHaveBeenCalledWith(
      `SELECT p.SD, p.median FROM '${admin1ParquetPath}' p ` +
      'WHERE p.gene = $gene AND p.mutation = $mutation',
    );
  });
});

describe('admin0 region metadata', () => {
  const importWithMetadata = async (contents: string) => {
    vi.resetModules();
    vi.doMock('node:fs/promises', async (importOriginal) => {
      const fs = await importOriginal<typeof import('node:fs/promises')>();
      const readFile = async (path: string, encoding: BufferEncoding) =>
        path.endsWith('admin0-region-metadata.json') ? contents : fs.readFile(path, encoding);
      return { ...fs, readFile };
    });
    try {
      return await import('../../src/utils/data.ts');
    } finally {
      vi.doUnmock('node:fs/promises');
    }
  };

  it('is parsed from the data file at startup, ignoring unused fields', async () => {
    const bounds = { min: { lat: 10, lng: -12 }, max: { lat: 25, lng: 4 } };
    const regions = [{ id: 'MLI', name: 'Mali', bounds }];

    const { admin0RegionMetadata } = await importWithMetadata(JSON.stringify(regions));

    expect(admin0RegionMetadata).toEqual([{ id: 'MLI', bounds }]);
  });

  it('prevents startup if the data file is not valid JSON', async () => {
    await expect(importWithMetadata('not json')).rejects.toThrow(SyntaxError);
  });

  it('prevents startup if the data file does not match the schema', async () => {
    const regions = [{ id: 'MLI', bounds: { min: { lat: 10 }, max: { lat: 25, lng: 4 } } }];

    await expect(importWithMetadata(JSON.stringify(regions)))
      .rejects.toThrow(/Invalid data file .*admin0-region-metadata\.json:\n.*\n {2}→ at \[0\]\.bounds\.min\.lng/);
  });
});
