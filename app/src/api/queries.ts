import { skipToken, useQuery } from '@tanstack/react-query';
import type { Columns } from '../lib/core/adapters.ts';
import { fetchJson } from './client.ts';
import { toRegionStatistics, type ModelStatistic, type RegionColumn } from './prevalences.ts';
import type { MetadataResponse } from './types.ts';

export type AdminLevel = 0 | 1 | 2;

export interface PrevalenceRequest {
  modelRelease: string;
  adminLevel: AdminLevel;
  gene: string;
  mutation: string;
  date: string;
  statistics: readonly ModelStatistic[];
  admin0?: string;
}

export const useMetadata = () =>
  useQuery({
    queryKey: ['metadata'],
    queryFn: ({ signal }) => fetchJson<MetadataResponse>('/metadata', {}, signal),
    staleTime: Infinity,
  });

export const usePrevalences = (request: PrevalenceRequest | undefined) =>
  useQuery({
    queryKey: ['prevalences', request],
    queryFn: request
      ? async ({ signal }) => {
          const regionColumn: RegionColumn = `admin${request.adminLevel}`;
          const columns = await fetchJson<Columns>(
            '/prevalences',
            {
              model_release: request.modelRelease,
              admin_level: request.adminLevel,
              gene: request.gene,
              mutation: request.mutation,
              date: request.date,
              admin0: request.admin0,
              properties: [regionColumn, ...request.statistics],
            },
            signal,
          );
          return toRegionStatistics(columns, regionColumn);
        }
      : skipToken,
    staleTime: Infinity,
  });
