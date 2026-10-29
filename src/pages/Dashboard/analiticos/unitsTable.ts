import type { NotifyingUnit } from '../../../service/srag/sragAnalytics';

export type UnitSortKey = 'name' | 'total' | 'cure' | 'death' | 'other';
export type SortDirection = 'asc' | 'desc';

/** Minúsculas e sem acento: "São Luiz" encontra "SAO LUIZ". */
export const normalizeText = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function filterUnits(items: NotifyingUnit[], query: string): NotifyingUnit[] {
  const needle = normalizeText(query.trim());
  if (!needle) return items;
  return items.filter(
    (item) => normalizeText(item.name).includes(needle) || item.id_unidade.includes(needle),
  );
}

export function sortUnits(
  items: NotifyingUnit[],
  key: UnitSortKey,
  direction: SortDirection,
): NotifyingUnit[] {
  const sign = direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const diff = key === 'name' ? a.name.localeCompare(b.name, 'pt-BR') : a[key] - b[key];
    return diff !== 0 ? sign * diff : a.name.localeCompare(b.name, 'pt-BR');
  });
}

export interface Page<T> {
  rows: T[];
  /** Posição (1-based) da primeira e da última linha da página. */
  from: number;
  to: number;
  pages: number;
  page: number;
}

/** A página pedida é limitada ao intervalo válido, então nunca fica fora da lista. */
export function paginate<T>(items: T[], page: number, size: number): Page<T> {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const safe = Math.min(Math.max(0, page), pages - 1);
  const start = safe * size;
  const rows = items.slice(start, start + size);
  return {
    rows,
    from: rows.length ? start + 1 : 0,
    to: start + rows.length,
    pages,
    page: safe,
  };
}
