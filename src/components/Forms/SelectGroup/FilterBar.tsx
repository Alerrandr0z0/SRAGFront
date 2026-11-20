import { Children, type CSSProperties, type ReactNode, useRef } from 'react';
import { useFitColumns } from '../../../hooks/useFitColumns';

/** Larguras possíveis da barra: todos numa linha, 4 + 3, 2 por linha ou um embaixo do outro. */
const COLUMN_OPTIONS = [7, 4, 2, 1] as const;
const MIN_ITEM_WIDTH = 160;
const GAP = 12;

/** Quantas colunas o último item ocupa para fechar a linha (1 quando a linha já está cheia). */
export function lastItemSpan(items: number, columns: number): number {
  if (items <= 0 || columns <= 0) return 1;
  const used = items % columns;
  return used === 0 ? 1 : columns - used + 1;
}

/**
 * Barra de filtros em grade: todos os campos com a mesma largura e altura, alinhados à
 * esquerda. Usa uma linha só quando a largura permite; senão quebra em linhas equilibradas, e o
 * último campo ocupa o que sobrar da linha para a grade terminar alinhada à direita.
 */
export default function FilterBar({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLFieldSetElement>(null);
  const columns = useFitColumns(ref, MIN_ITEM_WIDTH, GAP, COLUMN_OPTIONS);
  const lastSpan = lastItemSpan(Children.count(children), columns);

  return (
    <fieldset
      ref={ref}
      aria-label="Filtros"
      className="m-0 mb-6 grid min-w-0 border-0 p-0 items-start gap-3 [&>*:last-child]:[grid-column:span_var(--last-span)]"
      style={
        {
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          '--last-span': lastSpan,
        } as CSSProperties
      }
    >
      {children}
    </fieldset>
  );
}
