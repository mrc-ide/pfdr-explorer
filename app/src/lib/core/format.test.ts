import { describe, expect, it } from 'vitest';
import { formatInterval, formatPercent } from './format.ts';

const BELOW_SMALLEST_SHOWN = 0.04;
const SMALLEST_SHOWN = 0.1;

describe('formatPercent', () => {
  it.each([
    [25.3, 'en-GB', '25.3%'],
    [25.3, 'fr-FR', '25,3\u00a0%'],
    [0, 'en-GB', '0.0%'],
    [BELOW_SMALLEST_SHOWN, 'en-GB', '<0.1%'],
    [100, 'en-GB', '100.0%'],
    [null, 'en-GB', 'Not modelled'],
    [undefined, 'en-GB', 'Not modelled'],
    [Number.NaN, 'en-GB', 'Not modelled'],
  ])('formats %s in %s as %s', (value, locale, expected) => {
    expect(formatPercent(value, locale)).toBe(expected);
  });

  it('formats small values with the locale\'s own percent style', () => {
    expect(formatPercent(BELOW_SMALLEST_SHOWN, 'fr-FR')).toBe(`<${formatPercent(SMALLEST_SHOWN, 'fr-FR')}`);
  });
});

describe('formatInterval', () => {
  it('joins the two ends with an en dash and one percent sign', () => {
    expect(formatInterval(18.2, 45)).toBe('18.2–45.0%');
  });

  it('says Not modelled when either end is missing', () => {
    expect(formatInterval(null, 45)).toBe('Not modelled');
    expect(formatInterval(18.2, null)).toBe('Not modelled');
  });
});
