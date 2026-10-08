import type {
  ClinicalFlowResponse,
  OddsRatioRow,
  SignatureCell,
} from '../../../service/srag/sragAnalytics';
import type { ChartTheme } from './chartTheme';
import type { EChartsCoreOption } from './echartsCore';

const RED = '#DC2626';
const BLUE = '#3C50E0';
const GREEN = '#10B981';
const AMBER = '#F59E0B';
const CYAN = '#0FADCF';
const SLATE = '#94A3B8';

// ---------------------------------------------------------------------------
// Sankey — fluxo da jornada clínica
// ---------------------------------------------------------------------------

const NODE_COLORS: Record<string, string> = {
  Comunitária: GREEN,
  'Infecção Hospitalar': AMBER,
  'Internado em UTI': BLUE,
  'Internado em Enfermaria': CYAN,
  'Vent. Invasiva': RED,
  'Vent. Não Inv.': AMBER,
  'Sem Suporte': SLATE,
  Cura: GREEN,
  Óbito: RED,
  'Em Aberto': SLATE,
};

interface SankeyTooltipParams {
  dataType?: string;
  name?: string;
  value?: number;
  data?: { source?: string; target?: string; value?: number; pct?: number };
}

export function sankeyTooltip(params: SankeyTooltipParams): string {
  const { data } = params;
  if (params.dataType === 'edge' && data) {
    return `${data.source} → ${data.target}<br/><b>${data.value}</b> casos (${data.pct}% de "${data.source}")`;
  }
  return `${params.name}: <b>${params.value ?? 0}</b> casos`;
}

export function buildSankeyOption(
  flow: ClinicalFlowResponse,
  theme: ChartTheme,
): EChartsCoreOption {
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: theme.tooltipBg,
      borderColor: theme.grid,
      textStyle: { color: theme.tooltipText },
      formatter: (raw: unknown) => sankeyTooltip(raw as SankeyTooltipParams),
    },
    series: [
      {
        type: 'sankey',
        left: 8,
        right: 140,
        top: 8,
        bottom: 8,
        nodeAlign: 'justify',
        nodeWidth: 14,
        nodeGap: 14,
        draggable: false,
        emphasis: { focus: 'adjacency' },
        lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.4 },
        label: { color: theme.text, fontSize: 12 },
        data: flow.nodes.map((node) => ({
          name: node.name,
          itemStyle: { color: NODE_COLORS[node.name] ?? theme.muted },
        })),
        links: flow.links.map((link) => ({
          source: link.source,
          target: link.target,
          value: link.value,
          pct: link.pct,
        })),
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Forest plot — Odds Ratio das comorbidades
// ---------------------------------------------------------------------------

export interface OddsRatioPlot {
  /** Ordenado por OR crescente: o maior OR fica no topo do gráfico. */
  rows: OddsRatioRow[];
  /** Fatores sem casos suficientes para estimar o OR. */
  omitted: string[];
  axisMin: number;
  axisMax: number;
}

const isEstimable = (row: OddsRatioRow) => row.odds_ratio > 0 && row.value > 0;

export function prepareOddsRatio(rows: OddsRatioRow[]): OddsRatioPlot {
  const usable = rows.filter(isEstimable).sort((a, b) => a.odds_ratio - b.odds_ratio);
  const omitted = rows.filter((row) => !isEstimable(row)).map((row) => row.name);

  const lowest = usable.length > 0 ? Math.min(...usable.map((row) => row.ci_lower)) : 1;
  const highest = Math.max(10, ...usable.map((row) => Math.max(row.ci_upper, row.odds_ratio)));

  return {
    rows: usable,
    omitted,
    axisMin: lowest < 0.1 ? 0.01 : 0.1,
    axisMax: Math.min(1000, 10 ** Math.ceil(Math.log10(highest))),
  };
}

/** Vermelho: associado ao óbito (IC > 1). Azul: protetor (IC < 1). Cinza: sem significância. */
export function oddsRatioColor(row: OddsRatioRow): string {
  if (row.ci_lower > 1) return RED;
  if (row.ci_upper < 1) return BLUE;
  return SLATE;
}

interface CustomApi {
  value(dimension: number): number;
  coord(point: [number, number]): [number, number];
}

interface CustomParams {
  coordSys: { y: number; height: number };
}

function oddsTooltip(params: { data?: { row?: OddsRatioRow } }): string {
  const row = params.data?.row;
  if (!row) return '';
  return [
    `<b>${row.name}</b>`,
    `OR ${row.odds_ratio} (IC 95%: ${row.ci_lower}–${row.ci_upper})`,
    `${row.value} casos (${row.prevalence}% da base)`,
    `Letalidade: ${row.lethality}% (${row.deaths} óbitos)`,
  ].join('<br/>');
}

export function buildOddsRatioOption(plot: OddsRatioPlot, theme: ChartTheme): EChartsCoreOption {
  const clamp = (value: number) => Math.min(plot.axisMax, Math.max(plot.axisMin, value));
  const colors = plot.rows.map(oddsRatioColor);

  return {
    grid: { left: 140, right: 28, top: 16, bottom: 48 },
    tooltip: {
      trigger: 'item',
      backgroundColor: theme.tooltipBg,
      borderColor: theme.grid,
      textStyle: { color: theme.tooltipText },
      formatter: (raw: unknown) => oddsTooltip(raw as { data?: { row?: OddsRatioRow } }),
    },
    xAxis: {
      type: 'log',
      min: plot.axisMin,
      max: plot.axisMax,
      name: 'Odds Ratio (escala logarítmica)',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: { color: theme.muted },
      axisLabel: { color: theme.muted },
      splitLine: { lineStyle: { color: theme.grid } },
    },
    yAxis: {
      type: 'category',
      data: plot.rows.map((row) => row.name),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.text },
    },
    series: [
      {
        // Linha de referência: OR = 1 (sem associação).
        type: 'custom',
        silent: true,
        z: 1,
        data: [[1, 0]],
        encode: { x: 0, y: 1 },
        renderItem: (params: unknown, api: unknown) => {
          const { coordSys } = params as CustomParams;
          const x = (api as CustomApi).coord([1, 0])[0];
          return {
            type: 'line',
            shape: { x1: x, y1: coordSys.y, x2: x, y2: coordSys.y + coordSys.height },
            style: { stroke: theme.muted, lineWidth: 1, lineDash: [4, 4] },
          };
        },
      },
      {
        type: 'custom',
        z: 2,
        encode: { x: [1, 2, 3], y: 0 },
        data: plot.rows.map((row, index) => ({
          value: [
            index,
            clamp(row.odds_ratio),
            clamp(row.ci_lower),
            clamp(row.ci_upper),
            colors[index],
          ],
          row,
        })),
        renderItem: (_params: unknown, api: unknown) => {
          const customApi = api as CustomApi;
          const index = customApi.value(0);
          const middle = customApi.coord([customApi.value(1), index]);
          const low = customApi.coord([customApi.value(2), index]);
          const high = customApi.coord([customApi.value(3), index]);
          const color = colors[index];
          return {
            type: 'group',
            children: [
              {
                type: 'line',
                shape: { x1: low[0], y1: low[1], x2: high[0], y2: high[1] },
                style: { stroke: color, lineWidth: 2 },
              },
              {
                type: 'circle',
                shape: { cx: middle[0], cy: middle[1], r: 5 },
                style: { fill: color },
              },
            ],
          };
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Heatmap — assinatura clínica de sintomas
// ---------------------------------------------------------------------------

export function heatmapLabel(raw: { value?: number[] }): string {
  const value = raw.value ?? [];
  return (value[3] ?? 0) > 0 ? `${Math.round(value[2] ?? 0)}%` : '–';
}

export function buildHeatmapOption(
  labels: string[],
  bands: string[],
  matrix: SignatureCell[][],
  theme: ChartTheme,
  showLabels: boolean,
): EChartsCoreOption {
  const data = matrix.flatMap((row, y) =>
    row.map(([prevalence, cases], x) => ({
      value: [x, y, prevalence, cases],
      label: { color: prevalence > 55 ? '#FFFFFF' : theme.text },
    })),
  );

  return {
    grid: { left: showLabels ? 170 : 8, right: 8, top: 8, bottom: 30 },
    tooltip: {
      backgroundColor: theme.tooltipBg,
      borderColor: theme.grid,
      textStyle: { color: theme.tooltipText },
      formatter: (raw: unknown) => {
        const [x = 0, y = 0, prevalence = 0, cases = 0] = (raw as { value?: number[] }).value ?? [];
        return `${labels[y]} · ${bands[x]}<br/><b>${prevalence}%</b> (${cases} casos)`;
      },
    },
    xAxis: {
      type: 'category',
      data: bands,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: theme.muted, fontSize: 11 },
    },
    yAxis: {
      type: 'category',
      data: labels,
      inverse: true,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { show: showLabels, color: theme.text, fontSize: 11 },
    },
    visualMap: {
      show: false,
      min: 0,
      max: 100,
      dimension: 2,
      inRange: { color: [theme.heatLow, theme.heatHigh] },
    },
    series: [
      {
        type: 'heatmap',
        data,
        label: {
          show: true,
          fontSize: 10,
          formatter: (raw: unknown) => heatmapLabel(raw as { value?: number[] }),
        },
        itemStyle: { borderColor: theme.tooltipBg, borderWidth: 2 },
      },
    ],
  };
}
