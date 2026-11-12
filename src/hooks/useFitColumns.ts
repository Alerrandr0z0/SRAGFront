import { type RefObject, useLayoutEffect, useState } from 'react';

/**
 * Maior quantidade de colunas (entre `options`) em que cada item ainda tem pelo menos
 * `minItemWidth` de largura. Com `options = [7, 4, 2, 1]`, sobra uma linha só quando cabe e,
 * quando não cabe, uma grade equilibrada em vez de uma linha quase vazia.
 */
export function fitColumns(
  width: number,
  minItemWidth: number,
  gap: number,
  options: readonly number[],
): number {
  const sorted = [...options].sort((a, b) => b - a);
  const fits = sorted.find((cols) => cols * minItemWidth + (cols - 1) * gap <= width);
  return fits ?? sorted[sorted.length - 1] ?? 1;
}

/** Mede o contêiner e devolve quantas colunas cabem; acompanha mudanças de largura. */
export function useFitColumns(
  ref: RefObject<HTMLElement>,
  minItemWidth: number,
  gap: number,
  options: readonly number[],
): number {
  const [columns, setColumns] = useState(options[options.length - 1] ?? 1);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `options` é uma constante do chamador
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setColumns(fitColumns(element.clientWidth, minItemWidth, gap, options));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, minItemWidth, gap, options.join(',')]);

  return columns;
}
