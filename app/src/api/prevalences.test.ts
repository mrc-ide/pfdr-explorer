import { describe, expect, it } from 'vitest';
import { toRegionStatistics } from './prevalences.ts';

const DECIMAL_PLACES = 6;

describe('toRegionStatistics', () => {
  it('turns columns into one entry per region, in percent', () => {
    const regions = toRegionStatistics(
      { admin1: ['MLI.1_1', 'MLI.2_1'], median: [0.365939, null], SD: [0.0372585, 0.05] },
      'admin1',
    );
    expect(regions).toHaveLength(2);
    expect(regions[0].id).toBe('MLI.1_1');
    expect(regions[0].percent.median).toBeCloseTo(36.5939, DECIMAL_PLACES);
    expect(regions[0].percent.SD).toBeCloseTo(3.72585, DECIMAL_PLACES);
    expect(regions[1].percent.median).toBeNull();
  });

  it('ignores columns that are not model statistics', () => {
    const [region] = toRegionStatistics({ admin0: ['MLI'], date: ['2024-05'], median: [0.5] }, 'admin0');
    expect(region.percent).toEqual({ median: 50 });
  });

  it('refuses a row without a region code', () => {
    expect(() => toRegionStatistics({ admin1: [null], median: [0.5] }, 'admin1'))
      .toThrow('Row 1: "admin1" should be a region code, but is null.');
  });

  it('refuses a statistic that is not a number', () => {
    expect(() => toRegionStatistics({ admin1: ['A', 'B'], median: [0.5, '0.4'] }, 'admin1'))
      .toThrow('Row 2: "median" should be a number or empty, but is "0.4".');
  });
});
