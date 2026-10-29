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

  it('lists the requestable properties, given comma-separated or as repeated parameters', async () => {
    const response = await request(app).get('/schema');
    const [commaSeparated, repeated] = response.body['/prevalences'].properties.properties.anyOf;

    expect(repeated.items.enum).toEqual(expect.arrayContaining(['median', 'SD', 'admin2']));
    expect(repeated.items.enum).not.toContain('password');
    expect('median,SD,admin2').toMatch(new RegExp(commaSeparated.pattern));
    expect('median,password').not.toMatch(new RegExp(commaSeparated.pattern));
  });

  it('describes every parameter', async () => {
    const response = await request(app).get('/schema');

    for (const schema of Object.values<{ properties: Record<string, { description?: string }> }>(response.body)) {
      for (const param of Object.values(schema.properties)) {
        expect(param.description).toBeTruthy();
      }
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
