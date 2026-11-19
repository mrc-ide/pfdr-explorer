import { describe, expect, it } from 'vitest';
import { createSequentialScale } from './scales.ts';

const BOTTOM = 0;
const MIDDLE = 50;
const TOP = 100;
const HALFWAY_TO_MIDDLE = 25;
const BELOW_BOTTOM = -5;
const ABOVE_TOP = 120;

const STOPS = [
  { value: BOTTOM, colour: '#FCF7E1' },
  { value: MIDDLE, colour: '#B9466A' },
  { value: TOP, colour: '#3B1556' },
];

describe('createSequentialScale', () => {
  const colour = createSequentialScale(STOPS);

  it('returns the exact stop colours at the stops', () => {
    expect(colour(BOTTOM)).toBe('rgb(252, 247, 225)');
    expect(colour(MIDDLE)).toBe('rgb(185, 70, 106)');
    expect(colour(TOP)).toBe('rgb(59, 21, 86)');
  });

  it('blends in Lab between stops, not in RGB', () => {
    expect(colour(HALFWAY_TO_MIDDLE)).toBe('rgb(223, 160, 163)');
  });

  it('keeps missing apart from zero', () => {
    expect(colour(null)).toBeNull();
    expect(colour(undefined)).toBeNull();
    expect(colour(Number.NaN)).toBeNull();
    expect(colour(BOTTOM)).not.toBeNull();
  });

  it('clamps values outside the domain', () => {
    expect(colour(ABOVE_TOP)).toBe(colour(TOP));
    expect(colour(BELOW_BOTTOM)).toBe(colour(BOTTOM));
  });
});
