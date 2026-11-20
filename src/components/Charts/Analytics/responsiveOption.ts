import type { EChartsCoreOption } from './echartsCore';

/** Abaixo desta largura (px) os gráficos recebem margens e rótulos mais compactos. */
export const NARROW_WIDTH = 560;
const LABEL_SHARE = 0.38;
const NARROW_RIGHT = 76;
const MIN_LABEL = 84;
const CATEGORY_GUTTER = 72;

type Dict = Record<string, unknown>;

function isDict(value: unknown): value is Dict {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fitGrid(raw: Dict, width: number): Dict {
  const grid = raw.grid;
  if (!isDict(grid) || typeof grid.left !== 'number' || grid.left <= MIN_LABEL) return {};
  const left = Math.max(MIN_LABEL, Math.min(grid.left, Math.round(width * LABEL_SHARE)));
  const right = typeof grid.right === 'number' ? Math.min(grid.right, NARROW_RIGHT) : grid.right;
  const out: Dict = { grid: { ...grid, left, right } };
  const yAxis = raw.yAxis;
  if (isDict(yAxis) && isDict(yAxis.axisLabel)) {
    out.yAxis = {
      ...yAxis,
      axisLabel: { ...yAxis.axisLabel, width: left - 12, overflow: 'truncate' },
    };
  }
  return out;
}

function fitXAxis(raw: Dict, width: number): Dict {
  const xAxis = raw.xAxis;
  if (!isDict(xAxis)) return {};
  if (xAxis.type === 'value') return { xAxis: { ...xAxis, splitNumber: 3 } };
  if (xAxis.type === 'category' && Array.isArray(xAxis.data) && xAxis.data.length > 0) {
    const slot = Math.max(40, Math.floor((width - CATEGORY_GUTTER) / xAxis.data.length));
    const axisLabel = isDict(xAxis.axisLabel) ? xAxis.axisLabel : {};
    return {
      xAxis: { ...xAxis, axisLabel: { ...axisLabel, interval: 0, width: slot, overflow: 'break' } },
    };
  }
  return {};
}

/**
 * Em telas estreitas, rótulos de categoria (grid.left fixo), rótulos de valor (grid.right fixo)
 * e eixos numéricos disputam poucos pixels. Reduz margens, trunca rótulos e quebra o texto das
 * categorias horizontais.
 */
export function fitOptionToWidth(option: EChartsCoreOption, width: number): EChartsCoreOption {
  if (width <= 0 || width >= NARROW_WIDTH || !isDict(option)) return option;
  const raw = option as Dict;
  return { ...raw, ...fitXAxis(raw, width), ...fitGrid(raw, width) } as EChartsCoreOption;
}
