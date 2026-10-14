import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.ts';
import fixtureConfig from '../fixtures/fixture-config.json' with { type: 'json' };

const app = createApp();
const baseQuery = {
  model_release: fixtureConfig.modelRelease,
  gene: 'crt',
  mutation: '76K',
};

describe('GET /prevalences', () => {
  it('returns per-region info for a global single-date view', async () => {
    const response = await request(app)
      .get('/prevalences')
      .query({
        ...baseQuery,
        admin_level: '0',
        date: '2024-05',
        properties: 'admin0,median',
      });

    expect(response.status).toBe(200);
    expect(response.body.admin0).toStrictEqual(['ETH', 'MLI']);
    expect(response.body.median).toStrictEqual([
      expect.closeTo(0.32),
      expect.closeTo(0.27),
    ]);
  });

  it('returns results within a range of dates', async () => {
    const response = await request(app)
      .get('/prevalences')
      .query({
        ...baseQuery,
        admin_level: '0',
        date_from: '2024-06',
        date_to: '2025-01',
        properties: 'admin0,median,date',
      });

    expect(response.status).toBe(200);
    const expectedLength = 2 * 8; // 2 admin0 regions * 8 months in the date range
    expect(response.body.admin0).toHaveLength(expectedLength);
    expect(response.body.median).toHaveLength(expectedLength);
    expect(response.body.date).toHaveLength(expectedLength);
    expect(response.body.date).toContain('2024-06');
    expect(response.body.date).toContain('2025-01');
    expect(response.body.date).not.toContain('2023-01');
    expect(response.body.date).not.toContain('2026-01');
  });

  it('returns details for one region', async () => {
    const response = await request(app)
      .get('/prevalences')
      .query({
        ...baseQuery,
        admin_level: '1',
        admin1: 'MLI.1_1',
        date: '2024-05',
        properties: [
          'median',
          'mean',
          'lower_95',
          'upper_95',
          'SD',
          'exceedance_1',
          'exceedance_2',
          'exceedance_5',
          'exceedance_10',
          'no_of_informing_surveys',
        ].join(','),
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      median: [expect.closeTo(0.37)],
      mean: [expect.closeTo(0.34)],
      lower_95: [expect.closeTo(0.27)],
      upper_95: [expect.closeTo(0.41)],
      SD: [expect.closeTo(0.04)],
      exceedance_1: [expect.closeTo(1)],
      exceedance_2: [expect.closeTo(1)],
      exceedance_5: [expect.closeTo(1)],
      exceedance_10: [expect.closeTo(1)],
      no_of_informing_surveys: [20],
    });
  });

  it('can scope an admin1-level request to an admin0 region', async () => {
    const response = await request(app)
      .get('/prevalences')
      .query({
        ...baseQuery,
        admin_level: '1',
        admin0: 'MLI',
        date: '2024-05',
        properties: 'median,admin1',
      });

    expect(response.status).toBe(200);
    const rows = response.body.admin1.map((admin1: string, index: number) => ({
      admin1,
      median: response.body.median[index],
    }));
    expect(rows).toHaveLength(9);
    expect(rows).toEqual(expect.arrayContaining([
      { admin1: 'MLI.1_1', median: expect.closeTo(0.37) },
      { admin1: 'MLI.8_1', median: expect.closeTo(0.68) },
    ]));
  });

  it('can scope an admin2-level request to an admin0 region', async () => {
    const response = await request(app)
      .get('/prevalences')
      .query({
        ...baseQuery,
        admin_level: '2',
        admin0: 'MLI',
        date: '2024-05',
        properties: 'median,admin2',
      });

    expect(response.status).toBe(200);
    const rows = response.body.admin2.map((admin2: string, index: number) => ({
      admin2,
      median: response.body.median[index],
    }));
    expect(rows).toHaveLength(50);
    expect(rows).toEqual(expect.arrayContaining([
      { admin2: 'MLI.1.1_1', median: expect.closeTo(0.37) },
      { admin2: 'MLI.8.1_1', median: expect.closeTo(0.36) },
    ]));
  });

  it('returns an unbounded time series when date parameters are omitted', async () => {
    const response = await request(app)
      .get('/prevalences')
      .query({
        ...baseQuery,
        admin_level: '0',
        admin0: 'MLI',
        properties: 'date,median,lower_95,upper_95',
      });

    expect(response.status).toBe(200);
    const rows = response.body.date.map((date: string, index: number) => ({
      date,
      median: response.body.median[index],
    }));
    expect(rows).toHaveLength(13);
    expect(rows).toEqual(expect.arrayContaining([
      { date: '2024-05', median: expect.closeTo(0.27) },
      { date: '2024-06', median: expect.closeTo(0.29) },
      { date: '2025-05', median: expect.closeTo(0.25) },
    ]));
  });

  it('reports missing required parameters', async () => {
    const response = await request(app)
      .get('/prevalences')
      .query({ admin_level: '1' });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid input: expected string or array of strings, received undefined\n  → at properties');
    expect(response.body.error).toContain('Invalid input: expected string, received undefined\n  → at gene');
    expect(response.body.error).toContain('Invalid input: expected string, received undefined\n  → at mutation');
  });

  it('uses the latest model release when none is specified', async () => {
    const query = { gene: baseQuery.gene, mutation: baseQuery.mutation, admin_level: '0', properties: 'admin0,date,median' };

    const defaultResponse = await request(app).get('/prevalences').query(query);
    const explicitResponse = await request(app)
      .get('/prevalences')
      .query({ ...query, model_release: fixtureConfig.modelRelease });

    expect(defaultResponse.status).toBe(200);
    expect(defaultResponse.body.median.length).toBeGreaterThan(0);
    expect(defaultResponse.body).toEqual(explicitResponse.body);
  });

  it('rejects an unknown model release', async () => {
    const response = await request(app)
      .get('/prevalences')
      .query({ ...baseQuery, model_release: '../private', admin_level: '0', properties: 'median' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Invalid (input|option): expected/);
  });

  it.each([
    { adminLevel: '1', region: 'admin2' },
    { adminLevel: '0', region: 'admin1' },
    { adminLevel: '0', region: 'admin2' },
  ])('rejects a containing region more granular than the requested results ($region at admin_level $adminLevel)', async ({ adminLevel, region }) => {
    const response = await request(app)
      .get('/prevalences')
      .query({
        ...baseQuery,
        admin_level: adminLevel,
        [region]: 'MLI.1.1_1',
        properties: 'median',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('You cannot request results at a less granular level than that of the containing region.');
  });

  it('rejects an invalid requested property', async () => {
    const response = await request(app)
      .get('/prevalences')
      .query({
        ...baseQuery,
        admin_level: '1',
        date: '2024-05',
        properties: 'admin1,password',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid option: expected one of');
  });

  // Errors are reported as `{ error: z.prettifyError(zodError) }`, which prefixes each
  // message with '✖' and follows it with the path, hence `toContain`/`toMatch` rather than `toBe`.
  const validQuery = { ...baseQuery, admin_level: '2', properties: 'median' };

  describe('single-value query parameters', () => {
    it.each(['gene', 'mutation', 'admin0', 'admin1', 'admin2'])('rejects a comma-separated value for %s', async (param) => {
      const response = await request(app)
        .get('/prevalences')
        .query({ ...validQuery, [param]: 'a,b' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain(`Query parameter "${param}" must be a single string`);
    });

    const receivedArray = /Invalid input: expected string, received array/;
    const invalidOption = /Invalid (input|option): expected/;

    it.each([
      { param: 'gene', value: 'crt', zodError: receivedArray },
      { param: 'mutation', value: '76K', zodError: receivedArray },
      { param: 'admin_level', value: '2', zodError: invalidOption },
      { param: 'admin0', value: 'MLI', zodError: receivedArray },
      { param: 'admin1', value: 'MLI.1_1', zodError: receivedArray },
      { param: 'admin2', value: 'MLI.1.1_1', zodError: receivedArray },
      { param: 'model_release', value: fixtureConfig.modelRelease, zodError: invalidOption },
      { param: 'date', value: '2024-01', zodError: receivedArray },
      { param: 'date_from', value: '2024-01', zodError: receivedArray },
      { param: 'date_to', value: '2024-01', zodError: receivedArray },
    ])('rejects repeated values for $param', async ({ param, value, zodError }) => {
      const response = await request(app)
        .get('/prevalences')
        .query({ ...validQuery, [param]: [value, value] });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(zodError);
    });
  });

  describe('requested properties', () => {
    it('requires at least one property', async () => {
      const response = await request(app)
        .get('/prevalences')
        .query({ ...validQuery, properties: ',' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Too small: expected array to have >=1 items');
    });

    it('accepts a property regardless of case', async () => {
      const response = await request(app)
        .get('/prevalences')
        .query({ ...validQuery, properties: 'sd,MEDIAN' });

      expect(response.status).toBe(200);
      expect(Object.keys(response.body)).toEqual(['SD', 'median']);
    });

    it('rejects an allowed property absent from the parquet file', async () => {
      const response = await request(app)
        .get('/prevalences')
        .query({ ...validQuery, admin_level: '1', properties: 'admin2' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid property requested: admin2');
    });

    it.each([
      ['a comma-separated list', 'admin2,median'],
      ['repeated values', ['admin2', 'median']],
      ['a comma-separated list with empty items', 'admin2,,median'],
    ])('accepts a valid requested property list given as %s', async (_description, properties) => {
      const response = await request(app)
        .get('/prevalences')
        .query({ ...validQuery, properties });

      expect(response.status).toBe(200);
      expect(Object.keys(response.body)).toEqual(['admin2', 'median']);
    });
  });

  describe('date parameters for monthly date format', () => {
    it.each(['date', 'date_from', 'date_to'])('rejects an invalid %s format', async (parameter) => {
      const response = await request(app)
        .get('/prevalences')
        .query({ ...validQuery, [parameter]: '2024-05-01' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid string: must match pattern');
    });

    it.each(['date', 'date_from', 'date_to'])('rejects an invalid date for %s', async (parameter) => {
      const response = await request(app)
        .get('/prevalences')
        .query({ ...validQuery, [parameter]: '2026-99' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid string: must match pattern');
    });

    it.each(['date_from', 'date_to'])('does not requires %s with the other date range parameter', async (parameter) => {
      const response = await request(app)
        .get('/prevalences')
        .query({ ...validQuery, [parameter]: '2024-05' });

      expect(response.status).toBe(200);
    });

    it('rejects when date_from is later than date_to', async () => {
      const response = await request(app)
        .get('/prevalences')
        .query({
          ...validQuery,
          date_from: '2025-01',
          date_to: '2024-01',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain(`'date_from' cannot be later than 'date_to'.`);
    });
  });

  describe('admin level', () => {
    it('requires admin_level to be present', async () => {
      const response = await request(app)
        .get('/prevalences')
        .query({ ...validQuery, admin_level: undefined });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid option: expected one of "0"|"1"|"2"');
    });

    it('requires admin_level to be non-empty', async () => {
      const response = await request(app)
        .get('/prevalences')
        .query({ ...validQuery, admin_level: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid option: expected one of "0"|"1"|"2"');
    });

    it.each(['3', '01', '1.0'])('rejects an unsupported admin level: %s', async (adminLevel) => {
      const response = await request(app)
        .get('/prevalences')
        .query({ ...validQuery, admin_level: adminLevel });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid option: expected one of "0"|"1"|"2"');
    });

    it('accepts a valid level and containing region', async () => {
      const response = await request(app)
        .get('/prevalences')
        .query({ ...validQuery, admin_level: '2', admin1: 'MLI.1_1' });

      expect(response.status).toBe(200);
    });
  });

  describe('empty optional query parameters', () => {
    it.each([
      'model_release',
      'admin0',
      'admin1',
      'admin2',
      'date',
      'date_from',
      'date_to',
    ])('rejects an empty %s', async (param) => {
      const response = await request(app)
        .get('/prevalences')
        .query({ ...validQuery, [param]: '' });

      expect(response.status).toBe(400);
    });
  });

  it.each(['bbox', 'data_release', 'unknown'])('rejects an unrecognized parameter: %s', async (param) => {
    const response = await request(app)
      .get('/prevalences')
      .query({ ...validQuery, [param]: 'x' });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain(`Unrecognized key: "${param}"`);
  });
});
