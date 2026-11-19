import { QueryClient } from '@tanstack/react-query';

const RETRIES = 1;

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: RETRIES,
        refetchOnWindowFocus: false,
      },
    },
  });
