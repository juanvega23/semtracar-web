import { QueryClient } from '@tanstack/react-query';

/** Caché y reintentos de datos del servidor (RNF-11, RNF-12, RNF-25). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
