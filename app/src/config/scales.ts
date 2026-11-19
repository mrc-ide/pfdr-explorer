import type { ColourStop } from '../lib/core/scales.ts';

export const PREVALENCE_STOPS: readonly ColourStop[] = [
  { value: 0, colour: '#FCF7E1' },
  { value: 5, colour: '#F9E3A0' },
  { value: 15, colour: '#F5B76A' },
  { value: 30, colour: '#E3785A' },
  { value: 50, colour: '#B9466A' },
  { value: 75, colour: '#7A2A72' },
  { value: 100, colour: '#3B1556' },
];

export const PREVALENCE_TICKS = [0, 25, 50, 75, 100] as const;

export const SD_STOPS: readonly ColourStop[] = [
  { value: 0, colour: '#EAF6F6' },
  { value: 1.25, colour: '#C2DCDF' },
  { value: 2.5, colour: '#90BAC4' },
  { value: 5, colour: '#6296A6' },
  { value: 7.5, colour: '#3E7186' },
  { value: 11.25, colour: '#274D63' },
  { value: 15, colour: '#1A3044' },
];

export const EXCEEDANCE_STOPS: readonly ColourStop[] = [
  { value: 0, colour: '#F8F1EE' },
  { value: 20, colour: '#F0D2D0' },
  { value: 50, colour: '#DE909A' },
  { value: 80, colour: '#B5476A' },
  { value: 100, colour: '#6E1E45' },
];
