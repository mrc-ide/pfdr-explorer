import { describe, expect, it } from 'vitest';
import { contrastRatio, readableInk, relativeLuminance } from './contrast.ts';

describe('contrastRatio', () => {
  it('gives 21 for black on white and 1 for a colour on itself', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#0F5C5C', '#0F5C5C')).toBe(1);
  });

  it('gives the same answer whichever colour comes first', () => {
    expect(contrastRatio('#22262B', '#F3F1EC')).toBe(contrastRatio('#F3F1EC', '#22262B'));
  });

  it('accepts the rgb() strings colour scales produce', () => {
    expect(contrastRatio('rgb(255, 255, 255)', '#000000')).toBeCloseTo(21, 5);
  });

  it('refuses something that is not a colour', () => {
    expect(() => relativeLuminance('teal-ish')).toThrow('"teal-ish" is not a colour.');
  });
});

describe('readableInk', () => {
  it('picks dark ink on a pale fill and light ink on a dark fill', () => {
    expect(readableInk('#FCF7E1', '#22262B', '#FFFFFF')).toBe('#22262B');
    expect(readableInk('#3B1556', '#22262B', '#FFFFFF')).toBe('#FFFFFF');
  });
});
