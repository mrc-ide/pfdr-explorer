import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.ts';
import fixtureConfig from '../fixtures/fixture-config.json' with { type: 'json' };

const app = createApp();
const baseQuery = {
  data_release: fixtureConfig.dataRelease,
  gene: 'crt',
  mutation: '76K',
};
const pointProperties = ['survey_id','lat','lng','collection_day','denominator'];

describe('GET /surveys', () => {
  it('returns global survey points within a date range', async () => {
    const response = await request(app)
      .get('/surveys')
      .query({
        ...baseQuery,
        date_from: '2010-01-01',
        date_to: '2010-02-01',
        properties: pointProperties,
      });

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        survey_id: 's0006_kisii_period2',
        lat: -0.6805,
        lng: 34.7771,
        collection_day: '2010-01-01',
        denominator: 5,
      },
      {
        survey_id: 's0136_Bunkpurugu_period1',
        lat: 10.5418,
        lng: -0.1739,
        collection_day: '2010-01-01',
        denominator: 72,
      },
    ]);
  });

  it('returns additional surveys for a wide lazy-loading range', async () => {
    const response = await request(app)
      .get('/surveys')
      .query({
        ...baseQuery,
        date_from: '2000-01-01',
        date_to: '2025-01-01',
        properties: pointProperties,
      });

    expect(response.status).toBe(200);
    const surveyIds = response.body.map((survey: { survey_id: string }) => survey.survey_id);
    expect(surveyIds).toHaveLength(4);
    expect(surveyIds).toEqual(expect.arrayContaining(fixtureConfig.surveyIds));
  });

  it('returns the requested details for a single survey', async () => {
    const response = await request(app)
      .get('/surveys')
      .query({
        ...baseQuery,
        survey_id: 's0002_Gondar_Zuria',
        properties: [
          'lat',
          'lng',
          'site_name',
          'collection_day',
          'collection_start',
          'collection_end',
          'study_label',
          'reference_year',
          'numerator',
          'denominator',
          'prevalence',
          'prevalence_lower',
          'prevalence_upper',
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{
      lat: 12.6739,
      lng: 37.3435,
      site_name: 'Gondar Zuria',
      collection_day: '2022-07-02',
      collection_start: '2022-01-01',
      collection_end: '2023-01-01',
      study_label: 'Artemisinin resistant kelch13 R622I and RDT negativity approaching predominance in northern Ethiopia and emerging C580Y of African origin threaten falciparum malaria control.',
      reference_year: 2025,
      numerator: 75,
      denominator: 438,
      prevalence: expect.closeTo(17.12),
      prevalence_lower: expect.closeTo(13.71),
      prevalence_upper: expect.closeTo(20.98),
    }]);
  });

  it('filters country survey points using the country bounding box', async () => {
    const response = await request(app)
      .get('/surveys')
      .query({
        ...baseQuery,
        bbox: [-12.2389,10.1595,4.245,25], // Mali
        date_from: '2000-01-01',
        date_to: '2030-02-01',
        properties: pointProperties,
      });

    expect(response.status).toBe(200);
    const surveyIds = response.body.map((survey: { survey_id: string }) => survey.survey_id);
    expect(surveyIds).toHaveLength(2);
    expect(surveyIds).toEqual(expect.arrayContaining([
      'WWARN_16154388_mali_1998',
      's0136_Bunkpurugu_period1',
    ]));
  });

  it('returns a 400 for invalid requests', async () => {
    const response = await request(app)
      .get('/surveys')
      .query({
        ...baseQuery,
        bbox: [4.245,25,-12.2389,10.1595],
        date_from: '2000-01-01',
        date_to: '2030-02-01',
        properties: pointProperties,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid bbox: 4.245, 25, -12.2389, 10.1595. Expected format: min_lng,min_lat,max_lng,max_lat');
  });

  it('uses the data release of the latest model release when none is specified', async () => {
    const query = { gene: baseQuery.gene, mutation: baseQuery.mutation, properties: pointProperties };

    const defaultResponse = await request(app).get('/surveys').query(query);
    const explicitResponse = await request(app)
      .get('/surveys')
      .query({ ...query, data_release: fixtureConfig.dataRelease });

    expect(defaultResponse.status).toBe(200);
    expect(defaultResponse.body.length).toBeGreaterThan(0);
    expect(defaultResponse.body).toEqual(explicitResponse.body);
  });

  it('rejects an unknown data release', async () => {
    const response = await request(app)
      .get('/surveys')
      .query({
        ...baseQuery,
        data_release: '../private',
        properties: 'survey_id',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Invalid (input|option): expected/);
  });

  // Errors are reported as `{ error: z.prettifyError(zodError) }`, which prefixes each
  // message with '✖' and follows it with the path, hence `toContain`/`toMatch` rather than `toBe`.
  const validQuery = { ...baseQuery, properties: 'survey_id' };

  describe('required query parameters', () => {
    it('reports every missing parameter', async () => {
      const response = await request(app)
        .get('/surveys')
        .query({ ...baseQuery, mutation: undefined });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid input: expected string or array of strings, received undefined\n  → at properties');
      expect(response.body.error).toContain('Invalid input: expected string, received undefined\n  → at mutation');
    });

    it('rejects an empty required parameter', async () => {
      const response = await request(app)
        .get('/surveys')
        .query({ ...validQuery, mutation: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Too small: expected string to have >=1 characters\n  → at mutation');
    });

    it('accepts a request containing every required parameter', async () => {
      const response = await request(app).get('/surveys').query(validQuery);

      expect(response.status).toBe(200);
    });
  });

  describe('single-value query parameters', () => {
    it.each(['gene', 'mutation', 'survey_id'])('rejects a comma-separated value for %s', async (param) => {
      const response = await request(app)
        .get('/surveys')
        .query({ ...validQuery, [param]: 'a,b' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain(`Query parameter "${param}" must be a single string`);
    });

    const receivedArray = /Invalid input: expected string, received array/;
    const invalidOption = /Invalid (input|option): expected/;

    it.each([
      { param: 'gene', value: 'crt', zodError: receivedArray },
      { param: 'mutation', value: '76K', zodError: receivedArray },
      { param: 'survey_id', value: 's1', zodError: receivedArray },
      { param: 'data_release', value: fixtureConfig.dataRelease, zodError: invalidOption },
      { param: 'date_from', value: '2024-01-01', zodError: receivedArray },
      { param: 'date_to', value: '2024-01-01', zodError: receivedArray },
    ])('rejects repeated values for $param', async ({ param, value, zodError }) => {
      const response = await request(app)
        .get('/surveys')
        .query({ ...validQuery, [param]: [value, value] });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(zodError);
    });
  });

  describe('date parameters', () => {
    it.each(['date_from', 'date_to'])('rejects an invalid %s format', async (parameter) => {
      const response = await request(app)
        .get('/surveys')
        .query({ ...validQuery, [parameter]: '2025-01' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid ISO date');
    });

    it.each(['date_from', 'date_to'])('rejects an invalid date for %s', async (parameter) => {
      const response = await request(app)
        .get('/surveys')
        .query({ ...validQuery, [parameter]: '2026-99-99' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid ISO date');
    });

    it.each(['date_from', 'date_to'])('does not requires %s with the other date range parameter', async (parameter) => {
      const response = await request(app)
        .get('/surveys')
        .query({ ...validQuery, [parameter]: '2024-01-01' });

      expect(response.status).toBe(200);
    });

    it('rejects when date_from is later than date_to', async () => {
      const response = await request(app)
        .get('/surveys')
        .query({
          ...validQuery,
          date_from: '2025-01-01',
          date_to: '2024-01-01',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain(`'date_from' cannot be later than 'date_to'.`);
    });
  });

  describe('bounding box', () => {
    const expectedFormat = 'Expected format: min_lng,min_lat,max_lng,max_lat';

    it('accepts a valid bounding box given as a comma-separated list', async () => {
      const response = await request(app)
        .get('/surveys')
        .query({
          ...validQuery,
          bbox: '-12.2389,10.1595,4.245,25', // Mali
          date_from: '2000-01-01',
          date_to: '2030-02-01',
        });

      expect(response.status).toBe(200);
      const surveyIds = response.body.map((survey: { survey_id: string }) => survey.survey_id);
      expect(surveyIds).toHaveLength(2);
      expect(surveyIds).toEqual(expect.arrayContaining([
        'WWARN_16154388_mali_1998',
        's0136_Bunkpurugu_period1',
      ]));
    });

    it.each([
      ['a partial bounding box', '1,2'],
      ['a non-numeric coordinate', 'a,2,3,4'],
      ['an empty coordinate', ',2,3,4'],
    ])('rejects %s', async (_description, bbox) => {
      const response = await request(app)
        .get('/surveys')
        .query({ ...validQuery, bbox });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain(`Invalid bbox: ${bbox.split(',').join(', ')}. ${expectedFormat}`);
    });

    it('rejects a coordinate with trailing characters', async () => {
      const response = await request(app)
        .get('/surveys')
        .query({ ...validQuery, bbox: '1abc,2,3,4' });

      expect(response.status).toBe(400);
    });

    it.each(['0,-91,1,1', '0,0,1,91', '-181,0,1,1', '0,0,181,1'])('rejects an out-of-range bounding box: %s', async (bbox) => {
      const response = await request(app)
        .get('/surveys')
        .query({ ...validQuery, bbox });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Latitudes must be within ±90 and longitudes within ±180.');
    });

    it('rejects a bounding box that crosses the antimeridian', async () => {
      const response = await request(app)
        .get('/surveys')
        .query({ ...validQuery, bbox: '170,10,-170,20' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain(`Bounding box should not cross antimeridian. ${expectedFormat}`);
    });
  });

  describe('empty optional query parameters', () => {
    it.each([
      'data_release',
      'survey_id',
      'date_from',
      'date_to',
      'bbox',
    ])('rejects an empty %s', async (param) => {
      const response = await request(app)
        .get('/surveys')
        .query({ ...validQuery, [param]: '' });

      expect(response.status).toBe(400);
    });
  });

  it.each(['date', 'admin_level', 'unknown'])('rejects an unrecognized parameter: %s', async (param) => {
    const response = await request(app)
      .get('/surveys')
      .query({ ...validQuery, [param]: 'x' });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain(`Unrecognized key: "${param}"`);
  });
});
