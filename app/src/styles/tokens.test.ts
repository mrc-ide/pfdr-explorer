/// <reference types="vite/client" />

import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../lib/core/contrast.ts';
import tokensCss from './tokens.css?raw';

const TOKEN_DECLARATION = /--([\w-]+):\s*([^;]+);/g;
const TOKEN_REFERENCE = /^var\(--([\w-]+)\)$/;

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

const declared = new Map(
  [...tokensCss.matchAll(TOKEN_DECLARATION)].map(([, name, value]) => [name, value.trim()]),
);

const token = (name: string): string => {
  const value = declared.get(name);
  if (value === undefined) throw new Error(`No token --${name} in tokens.css.`);
  const reference = TOKEN_REFERENCE.exec(value);
  if (reference === null) return value;
  const [, referencedName] = reference;
  return token(referencedName);
};

const allPairs = (firsts: string[], seconds: string[]): string[][] =>
  firsts.flatMap(first => seconds.map(second => [first, second]));

describe('design tokens meet WCAG AA contrast', () => {
  const textColours = ['text-primary', 'text-secondary', 'text-tertiary', 'text-disabled', 'link', 'link-hover', 'text-warning', 'text-error'];
  const controlLines = ['border-control', 'focus-ring'];
  const surfaces = ['bg-page', 'surface-card'];

  it.each(allPairs(textColours, surfaces))('--%s on --%s', (text, surface) => {
    expect(contrastRatio(token(text), token(surface))).toBeGreaterThanOrEqual(AA_TEXT);
  });


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

  it.each(allPairs(controlLines, surfaces))('--%s on --%s', (line, surface) => {
    expect(contrastRatio(token(line), token(surface))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });
});
