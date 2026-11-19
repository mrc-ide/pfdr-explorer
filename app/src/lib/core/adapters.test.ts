import { describe, it, expect } from 'vitest';
import { fractionToPercent, zipColumns } from './adapters.ts';

describe('zipColumns', () => {
  it('zips columnar API output into rows by index', () => {
    expect(zipColumns({ admin1: ['A', 'B'], median: [0.25, null]})).toEqual([
      { admin1: 'A', median: 0.25 },
      { admin1: 'B', median: null }
    ]);
  });

  it('turns no columns into no rows', () => {
    expect(zipColumns({})).toEqual([]);
  });

  it('refuses columns of different lengths', () => {
    expect(() => zipColumns({ admin1: ['A', 'B'], median: [0.25] }))
    .toThrow('Column "median" has 1 values; expected 2, like "admin1".');
  });
});

describe('fractionToPercent', () => {
  it('converts fractions to percentages', () => {
    expect(fractionToPercent(0.25)).toBe(25);
    expect(fractionToPercent(0)).toBe(0);
  });

  it('leaves missing as missing', () => {
    expect(fractionToPercent(null)).toBeNull();
  });
});
