import { useEffect, useState } from 'react';
import type { ChartStatus } from '../../../components/Charts/Analytics/ChartCard';
import { buildSragQueryParams, type SragFilters } from '../../../service/srag/sragFilters';

type LoadStatus = 'loading' | 'ready' | 'error';

export interface Slice<T> {
  data: T | null;
  status: LoadStatus;
}

/**
 * Busca os dados de um gráfico sempre que os filtros (ou `extra`) mudam.
 * Cada gráfico tem seu próprio estado: se um endpoint falhar, os outros seguem.
 */
export default function useAnalyticsData<T>(
  fetcher: (filters: SragFilters, extra: string) => Promise<T>,
  filters: SragFilters,
  extra = '',
): Slice<T> {
  const [slice, setSlice] = useState<Slice<T>>({ data: null, status: 'loading' });
  const key = buildSragQueryParams(filters);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` serializa todos os filtros
  useEffect(() => {
    let cancelled = false;
    setSlice((current) => ({ ...current, status: 'loading' }));
    fetcher(filters, extra)
      .then((data) => !cancelled && setSlice({ data, status: 'ready' }))
      .catch(() => !cancelled && setSlice((current) => ({ ...current, status: 'error' })));
    return () => {
      cancelled = true;
    };
  }, [fetcher, key, extra]);

  return slice;
}

export function toCardStatus<T>(slice: Slice<T>, isEmpty: (data: T) => boolean): ChartStatus {
  if (slice.data === null) return slice.status === 'error' ? 'error' : 'loading';
  return isEmpty(slice.data) ? 'empty' : 'ready';
}

export const isRefreshing = (slice: Slice<unknown>) =>
  slice.status === 'loading' && slice.data !== null;
