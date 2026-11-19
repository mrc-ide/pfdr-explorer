import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { usePrevalences, useMetadata, type PrevalenceRequest } from './queries.ts';
import { createQueryClient } from './queryClient.ts';

const ONE_RETRY = 1;

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const respondWith = (body: unknown) =>
  vi.stubGlobal('fetch', vi.fn(async () => Response.json(body)));

const request: PrevalenceRequest = {
  modelRelease: 'v0.1.0',
  adminLevel: 1,
  gene: 'crt',
  mutation: '76K',
  date: '2024-05',
  statistics: ['median', 'lower_95', 'upper_95'],
};

describe('useMetadata', () => {
  it('fetches the metadata once', async () => {
    respondWith({ model_releases: ['v0.1.0'] });
    const { result } = renderHook(() => useMetadata(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.model_releases).toEqual(['v0.1.0']);
    expect(fetch).toHaveBeenCalledOnce();
  });
});

describe('usePrevalences', () => {
  it('asks for the region column and the statistics, and returns percent', async () => {
    respondWith({ admin1: ['MLI.1_1'], median: [0.25], lower_95: [0.1], upper_95: [0.4] });
    const { result } = renderHook(() => usePrevalences(request), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith(
      '/api/prevalences?model_release=v0.1.0&admin_level=1&gene=crt&mutation=76K&date=2024-05&properties=admin1%2Cmedian%2Clower_95%2Cupper_95',
      expect.anything(),
    );
    expect(result.current.data).toEqual([{ id: 'MLI.1_1', percent: { median: 25, lower_95: 10, upper_95: 40 } }]);
  });

  it('waits, without fetching, until it has a request', () => {
    respondWith({});
    const { result } = renderHook(() => usePrevalences(undefined), { wrapper });
    expect(result.current.isPending).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reports bad data as an error instead of drawing it', async () => {
    respondWith({ admin1: ['MLI.1_1'], median: ['0.25'] });
    const { result } = renderHook(() => usePrevalences(request), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Row 1: "median" should be a number or empty, but is "0.25".');
  });
});

describe('createQueryClient', () => {
  it('retries once and does not refetch on window focus', () => {
    const options = createQueryClient().getDefaultOptions().queries;
    expect(options?.retry).toBe(ONE_RETRY);
    expect(options?.refetchOnWindowFocus).toBe(false);
  });
});
