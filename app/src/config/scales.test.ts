import { describe, expect, it } from 'vitest';
import { relativeLuminance } from '../lib/core/contrast.ts';
import { EXCEEDANCE_STOPS, PREVALENCE_STOPS, PREVALENCE_TICKS, SD_STOPS } from './scales.ts';

describe.each([
  ['prevalence', PREVALENCE_STOPS],
  ['SD', SD_STOPS],
  ['exceedance', EXCEEDANCE_STOPS],
])('the %s scale', (_name, stops) => {
  it('starts at 0 and rises', () => {
    expect(stops[0].value).toBe(0);
    stops.slice(1).forEach((stop, index) => expect(stop.value).toBeGreaterThan(stops[index].value));
  });

  it('gets darker at every stop, so order can be read without hue', () => {
    stops.slice(1).forEach((stop, index) =>
      expect(relativeLuminance(stop.colour)).toBeLessThan(relativeLuminance(stops[index].colour)));
  });
});

describe('prevalence ticks', () => {
  it('stay within the scale', () => {
    expect(PREVALENCE_TICKS[0]).toBe(PREVALENCE_STOPS[0].value);
    expect(PREVALENCE_TICKS.at(-1)).toBe(PREVALENCE_STOPS.at(-1)?.value);
  });
});
