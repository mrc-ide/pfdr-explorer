import { beforeEach, describe, expect, it, vi } from 'vitest';

const readFile = vi.hoisted(() => vi.fn());

vi.mock('node:fs/promises', () => ({ readFile }));

vi.mock('../../src/constants.ts', () => ({
  modelVersions: ['v0.1.0', 'v0.9.0', 'v0.10.0'],
  dataVersions: ['v1.0.0', 'v1.2.3'],
}));

const metadata = (version: string, data_release = 'v1.0.0') => ({
  version,
  data_release,
  shapefile_source: 'https://example.com/shapefiles',
});

// Model metadata is read when the module is first imported, i.e. at server startup.
const importReleases = () => import('../../src/utils/releases.ts');

beforeEach(() => {
  vi.resetModules();
  readFile.mockImplementation(async (path: string) => {
    const version = path.split('/').at(-2)!;
    return JSON.stringify(metadata(version, version === 'v0.10.0' ? 'v1.2.3' : 'v1.0.0'));
  });
});

describe('model releases', () => {
  it('reads the metadata of every model release', async () => {
    const { modelMetadata } = await importReleases();

    expect(modelMetadata).toEqual({
      'v0.1.0': metadata('v0.1.0'),
      'v0.9.0': metadata('v0.9.0'),
      'v0.10.0': metadata('v0.10.0', 'v1.2.3'),
    });
  });

  it('defaults to v0.10.0 rather than v0.9.0 using semantic-version order', async () => {
    const { latestModelRelease } = await importReleases();

    expect(latestModelRelease).toBe('v0.10.0');
  });

  it('defaults to the data release specified in the latest model metadata', async () => {
    const { defaultDataRelease } = await importReleases();

    expect(defaultDataRelease).toBe('v1.2.3');
  });
});

describe('malformed model metadata', () => {
  it('prevents startup if a metadata file is not valid JSON', async () => {
    readFile.mockResolvedValueOnce('not json');

    await expect(importReleases()).rejects.toThrow(SyntaxError);
  });

  it('prevents startup if a metadata file is missing a field', async () => {
    readFile.mockResolvedValueOnce(JSON.stringify({ version: 'v0.1.0', data_release: 'v1.0.0' }));

    await expect(importReleases()).rejects.toThrow(
      /Invalid data file .*v0\.1\.0\/metadata\.json:\n.*\n {2}→ at shapefile_source/,
    );
  });

  it('prevents startup if a model release depends on an unknown data release', async () => {
    readFile.mockResolvedValueOnce(JSON.stringify(metadata('v0.1.0', 'v9.9.9')));

    await expect(importReleases()).rejects.toThrow('Unknown data release: v9.9.9');
  });
});
