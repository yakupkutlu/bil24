import { useQuery, UseQueryOptions } from '@tanstack/react-query';

export type ApiResourceSource = 'api';

export type ApiResourceResult<T> = {
  data: T;
  source: ApiResourceSource;
  errorMessage?: string;
};

export function useApiResource<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  _unusedData?: T,
  options?: Omit<UseQueryOptions<ApiResourceResult<T>>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ApiResourceResult<T>>({
    queryKey,
    queryFn: async () => ({ data: await queryFn(), source: 'api' }),
    staleTime: 30_000,
    retry: 1,
    ...options
  });
}
