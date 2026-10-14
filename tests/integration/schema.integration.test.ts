import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.ts';
import fixtureConfig from '../fixtures/fixture-config.json' with { type: 'json' };

const app = createApp();

describe('GET /schema', () => {
  it('returns a JSON Schema for the query parameters of each endpoint', async () => {
    const response = await request(app).get('/schema');

    expect(response.status).toBe(200);
    expect(Object.keys(response.body)).toEqual(['/metadata', '/surveys', '/prevalences']);
    for (const schema of Object.values(response.body)) {
      expect(schema).toMatchObject({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        additionalProperties: false,
      });
    }
  });

  it('describes the required parameters of each endpoint', async () => {
    const response = await request(app).get('/schema');

    expect(response.body['/metadata'].required).toBeUndefined();
    expect(response.body['/surveys'].required).toEqual(['properties', 'gene', 'mutation']);
    expect(response.body['/prevalences'].required).toEqual(['properties', 'gene', 'mutation', 'admin_level']);
  });

  it('describes properties as a list of strings', async () => {
    const response = await request(app).get('/schema');

    for (const endpoint of ['/surveys', '/prevalences']) {
      expect(response.body[endpoint].properties.properties.anyOf).toEqual([
        { type: 'string' },
        { type: 'array', items: { type: 'string' } },
      ]);
    }
  });

  it('lists the available releases and their defaults', async () => {
    const response = await request(app).get('/schema');

    expect(response.body['/metadata'].properties.model_release).toMatchObject({
      enum: [fixtureConfig.modelRelease],
      default: fixtureConfig.modelRelease,
    });
    expect(response.body['/surveys'].properties.data_release).toMatchObject({
      enum: [fixtureConfig.dataRelease],
      default: fixtureConfig.dataRelease,
    });
  });
});
