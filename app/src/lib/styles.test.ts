/// <reference types="vite/client" />

import { describe, expect, it } from 'vitest';

const DEFAULTS = './charm/defaults.css';
const CONSTANTS = './charm/constants.css';
const THEME_PREFIX = '--charm-';
const INTERNAL_PREFIX = '--_charm-';
const LINE_MAX_PX = 3;
const PILL_PX = 999;
const PLAIN_NUMBERS = new Set(['1', '-1', '100%']);

const DECLARATION = /(--[\w-]+)\s*:/g;
const REGISTRATION = /@property\s+(--[\w-]+)/g;
const READ = /var\(\s*(--[\w-]+)\s*([,)])/g;
const RAW_COLOUR = /#[0-9a-f]{3,8}\b|\b(?:rgb|hsl)a?\(/gi;
const PIXELS = /(?<![\w.-])(\d*\.?\d+)px\b/g;
const ORDINARY_DECLARATION = /(?<![\w-])([a-z][\w-]*)\s*:\s*([^;{}]+);/g;
const NUMBER = /(?<![\w#.-])-?\d*\.?\d+[a-z%]*/gi;

interface Known {
  theme: ReadonlySet<string>;
  internal: ReadonlySet<string>;
}

const declarations = (css: string) => [...css.matchAll(DECLARATION)].map(([, name]) => name);
const registrations = (css: string) => [...css.matchAll(REGISTRATION)].map(([, name]) => name);
const reads = (css: string) =>
  [...css.matchAll(READ)].map(([, name, next]) => ({ name, fallback: next === ',' }));

const isLibraryName = (name: string) => name.startsWith(THEME_PREFIX) || name.startsWith(INTERNAL_PREFIX);
const isPlain = (number: string) => Number.parseFloat(number) === 0 || PLAIN_NUMBERS.has(number);

const unnamedNumbers = (css: string) =>
  [...css.matchAll(ORDINARY_DECLARATION)].flatMap(([, property, value]) =>
    [...value.matchAll(NUMBER)]
      .map(([number]) => ({ property, number }))
      .filter(({ number }) => !isPlain(number)),
  );

const problemsIn = (css: string, known: Known, isDefaults = false): string[] => {
  const declaredHere = new Set(declarations(css));
  return [
    ...declarations(css)
      .filter(name => !isLibraryName(name))
      .map(name => `declares ${name}: library properties start with ${THEME_PREFIX} or ${INTERNAL_PREFIX}`),
    ...reads(css)
      .filter(({ name }) => !isLibraryName(name))
      .map(({ name }) => `reads ${name}: library properties start with ${THEME_PREFIX} or ${INTERNAL_PREFIX}`),
    ...reads(css)
      .filter(({ name, fallback }) => name.startsWith(THEME_PREFIX) && !fallback && !known.theme.has(name))
      .map(({ name }) => `reads ${name}, which has no default in charm/defaults.css and no fallback`),
    ...reads(css)
      .filter(({ name }) => name.startsWith(INTERNAL_PREFIX) && !known.internal.has(name) && !declaredHere.has(name))
      .map(({ name }) => `reads ${name}, which isn't declared in charm/constants.css or in this stylesheet`),
    ...(isDefaults ? [] : [...css.matchAll(RAW_COLOUR)])
      .map(([colour]) => `uses the raw colour ${colour}: colours come from the theme, in charm/defaults.css`),
    ...[...css.matchAll(PIXELS)]
      .filter(([, value]) => Number(value) > LINE_MAX_PX && Number(value) !== PILL_PX)
      .map(([size]) => `uses ${size}: sizes are in em, so they scale; only lines (up to ${LINE_MAX_PX}px) are in px`),
    ...unnamedNumbers(css)
      .map(({ property, number }) => `uses ${number} in ${property}: give it a name, as a ${INTERNAL_PREFIX} property`),
  ];
};

describe('the library styling contract', () => {
  const sheets = import.meta.glob<string>('./**/*.css', { query: '?raw', import: 'default', eager: true });
  const known: Known = {
    theme: new Set([...declarations(sheets[DEFAULTS] ?? ''), ...Object.values(sheets).flatMap(registrations)]),
    internal: new Set(declarations(sheets[CONSTANTS] ?? '')),
  };
  const nothingKnown: Known = { theme: new Set(), internal: new Set() };

  it('holds for every stylesheet in src/lib', () => {
    const problems = Object.entries(sheets).flatMap(([path, css]) =>
      problemsIn(css, known, path === DEFAULTS).map(problem => `${path} ${problem}`),
    );
    expect(problems).toEqual([]);
  });

  it('accepts themed colours, a fallback, named sizes and plain zeros and ones', () => {
    const css = '.a { --_charm-height: 2.75em; min-height: var(--_charm-height); margin: 0; flex: 1; color: var(--charm-ink); background: var(--charm-button-bg, var(--charm-ink)); }';
    expect(problemsIn(css, { theme: new Set(['--charm-ink']), internal: new Set() })).toEqual([]);
  });

  it('refuses a property without either prefix, declared or read', () => {
    expect(problemsIn('.a { --gap: 0; color: var(--accent); }', nothingKnown)).toEqual([
      'declares --gap: library properties start with --charm- or --_charm-',
      'reads --accent: library properties start with --charm- or --_charm-',
    ]);
  });

  it('refuses a --charm- property with no default and no fallback', () => {
    expect(problemsIn('.a { color: var(--charm-ink); }', nothingKnown)).toEqual([
      'reads --charm-ink, which has no default in charm/defaults.css and no fallback',
    ]);
  });

  it('refuses a --_charm- property declared nowhere', () => {
    expect(problemsIn('.a { gap: var(--_charm-gap); }', nothingKnown)).toEqual([
      "reads --_charm-gap, which isn't declared in charm/constants.css or in this stylesheet",
    ]);
  });

  it('refuses a raw colour, except in the defaults', () => {
    expect(problemsIn('.a { color: #22262B; }', nothingKnown)).toEqual([
      'uses the raw colour #22262B: colours come from the theme, in charm/defaults.css',
    ]);
    expect(problemsIn(':where(:root) { --charm-ink: #22262B; }', nothingKnown, true)).toEqual([]);
  });

  it('refuses a size in px, even with a name', () => {
    expect(problemsIn(':where(:root) { --_charm-height: 44px; --_charm-focus-width: 3px; }', nothingKnown)).toEqual([
      'uses 44px: sizes are in em, so they scale; only lines (up to 3px) are in px',
    ]);
  });

  it('refuses a number without a name', () => {
    expect(problemsIn('.a { gap: 0.5em; margin: 0; }', nothingKnown)).toEqual([
      'uses 0.5em in gap: give it a name, as a --_charm- property',
    ]);
  });
});
