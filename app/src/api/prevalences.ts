import { fractionToPercent, zipColumns, type Columns } from '../lib/core/adapters.ts';
import type { PrevalenceColumn } from './types.ts';

export const MODEL_STATISTICS = [
  'mean',
  'median',
  'lower_95',
  'upper_95',
  'SD',
  'exceedance_1',
  'exceedance_2',
  'exceedance_5',
  'exceedance_10',
] as const satisfies readonly PrevalenceColumn[];

export type ModelStatistic = (typeof MODEL_STATISTICS)[number];
export type RegionColumn = 'admin0' | 'admin1' | 'admin2';

export interface RegionStatistics {
  id: string;
  percent: Partial<Record<ModelStatistic, number | null>>;
}

const isModelStatistic = (column: string): column is ModelStatistic =>
  (MODEL_STATISTICS as readonly string[]).includes(column);

export const toRegionStatistics = (columns: Columns, regionColumn: RegionColumn): RegionStatistics[] =>
  zipColumns(columns).map((row, index) => {
    const rowNumber = index + 1;
    const id = row[regionColumn];
    if (typeof id !== 'string') {
      throw new Error(`Row ${rowNumber}: "${regionColumn}" should be a region code, but is ${JSON.stringify(id)}.`);
    }
    const percent: RegionStatistics['percent'] = {};
    for (const [column, value] of Object.entries(row)) {
      if (!isModelStatistic(column)) continue;
      if (value !== null && typeof value !== 'number') {
        throw new Error(`Row ${rowNumber}: "${column}" should be a number or empty, but is ${JSON.stringify(value)}.`);
      }
      percent[column] = fractionToPercent(value);
    }
    return { id, percent };
  });
