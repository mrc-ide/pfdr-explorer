export const PERCENT_PER_WHOLE = 100;

export type Columns = Record<string, readonly unknown[]>;

export const zipColumns = (columns: Columns): Record<string, unknown>[] => {
  const names = Object.keys(columns);
  if (names.length === 0) return [];
  const [firstName] = names;
  const rowCount = columns[firstName].length;
  const mismatched = names.find(name => columns[name].length !== rowCount);
  if (mismatched) {
    throw new Error(`Column "${mismatched}" has ${columns[mismatched].length} values; expected ${rowCount}, like "${firstName}".`);
  }

  return Array.from({ length: rowCount }, (_, row) =>
    Object.fromEntries(names.map(name => [name, columns[name][row]]))
  );
};

export const fractionToPercent = (value: number | null): number | null =>
  value == null ? null : value * PERCENT_PER_WHOLE;
