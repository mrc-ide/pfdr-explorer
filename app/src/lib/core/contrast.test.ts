import { describe, expect, it } from 'vitest';
import { contrastRatio, readableInk, relativeLuminance } from './contrast.ts';

const BLACK = '#000000';
const WHITE = '#FFFFFF';
const WHITE_AS_RGB = 'rgb(255, 255, 255)';
const INK = '#22262B';
const PAPER = '#F3F1EC';
const TEAL = '#0F5C5C';
const PALEST_PREVALENCE = '#FCF7E1';
const DARKEST_PREVALENCE = '#3B1556';

const HIGHEST_CONTRAST = 21;
const NO_CONTRAST = 1;
const DECIMAL_PLACES = 5;

describe('contrastRatio', () => {
  it('gives 21 for black on white and 1 for a colour on itself', () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(HIGHEST_CONTRAST, DECIMAL_PLACES);
    expect(contrastRatio(TEAL, TEAL)).toBe(NO_CONTRAST);
  });

  it('gives the same answer whichever colour comes first', () => {
    expect(contrastRatio(INK, PAPER)).toBe(contrastRatio(PAPER, INK));
  });

  it('accepts the rgb() strings colour scales produce', () => {
    expect(contrastRatio(WHITE_AS_RGB, BLACK)).toBeCloseTo(HIGHEST_CONTRAST, DECIMAL_PLACES);
  });

  it('refuses something that is not a colour', () => {
    expect(() => relativeLuminance('teal-ish')).toThrow('"teal-ish" is not a colour.');
  });
});

describe('readableInk', () => {
  it('picks dark ink on a pale fill and light ink on a dark fill', () => {
    expect(readableInk(PALEST_PREVALENCE, INK, WHITE)).toBe(INK);
    expect(readableInk(DARKEST_PREVALENCE, INK, WHITE)).toBe(WHITE);
  });
});
