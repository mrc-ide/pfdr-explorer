import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../lib/core/contrast.ts';
import tokensCss from './tokens.css?raw';

const declared = new Map(
  [...tokensCss.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
);

const token = (name: string): string => {
  const value = declared.get(name);
  if (value === undefined) throw new Error(`No token --${name} in tokens.css.`);
  const reference = /^var\(--([\w-]+)\)$/.exec(value);
  return reference ? token(reference[1]) : value;
};

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

describe('design tokens meet WCAG AA contrast', () => {
  const textColours = ['text-primary', 'text-secondary', 'text-tertiary', 'text-disabled', 'link', 'link-hover', 'text-warning', 'text-error'];
  const surfaces = ['bg-page', 'surface-card'];

  it.each(textColours.flatMap(text => surfaces.map(surface => [text, surface])))(
    '--%s on --%s',
    (text, surface) => {
      expect(contrastRatio(token(text), token(surface))).toBeGreaterThanOrEqual(AA_TEXT);
    },
  );

  it.each([
    ['text-on-accent', 'accent'],
    ['text-on-accent', 'accent-hover'],
    ['text-warning', 'warning-bg'],
    ['text-error', 'error-bg'],
    ['text-primary', 'accent-bg-selected'],
    ['text-accent', 'accent-bg-selected'],
    ['text-secondary', 'surface-sunken'],
  ])('--%s on --%s', (text, surface) => {
    expect(contrastRatio(token(text), token(surface))).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(['border-control', 'focus-ring'].flatMap(line => surfaces.map(surface => [line, surface])))(
    '--%s on --%s',
    (line, surface) => {
      expect(contrastRatio(token(line), token(surface))).toBeGreaterThanOrEqual(AA_NON_TEXT);
    },
  );
});
