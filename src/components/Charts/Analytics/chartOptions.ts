import type {
  AntiviralWindow,
  AntiviralWindowsResponse,
  ClinicalFlowResponse,
  DiagnosticLethalityMethod,
  DiagnosticLethalityResponse,
  DiagnosticMethodsPeriod,
  DiagnosticMethodsResponse,
  IcuAccessPeriod,
  IcuAccessResponse,
  IcuGranularity,
  ImagingFinding,
  LethalityAgeAgentResponse,
  NosocomialPeriod,
  NosocomialRiskResponse,
  OddsRatioRow,
  SamplePositivityResponse,
  SamplePositivityRow,
  SeverityByAgePoint,
  SeverityByAgeResponse,
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

// ---------------------------------------------------------------------------
// Acesso à UTI — barras empilhadas (100%) por faixa de espera
// ---------------------------------------------------------------------------

const LIME = '#84CC16';
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "2024" → "2024"; "2024-Q1" → "T1/2024"; "2024-03" → "mar/24". */
export function formatPeriod(granularity: IcuGranularity, key: string): string {
  if (granularity === 'quarter') {
    const [year, quarter] = key.split('-Q');
    return `T${quarter}/${year}`;
  }
  if (granularity === 'month') {
    const [year = '', month = ''] = key.split('-');
    return `${MONTHS[Number(month) - 1] ?? month}/${year.slice(2)}`;
  }
  return key;
}

/** Verde = rápido; amarelo e vermelho = espera acima do limite aceitável. */
export const ICU_BANDS = [
  { key: 'same_day', label: 'Mesmo dia', color: GREEN, text: '#FFFFFF' },
  { key: 'd1_3', label: '1 a 3 dias (dentro do limite)', color: LIME, text: '#1C2434' },
  { key: 'd4_7', label: '4 a 7 dias', color: AMBER, text: '#1C2434' },
  { key: 'd8_plus', label: 'Mais de 7 dias', color: RED, text: '#FFFFFF' },
] as const;

export const percentOf = (count: number, total: number) => (total > 0 ? (count / total) * 100 : 0);

export const formatPercent = (value: number) => `${value.toFixed(1).replace('.', ',')}%`;

export function icuPeriodTooltip(period: IcuAccessPeriod, granularity: IcuGranularity): string {
  const bands = ICU_BANDS.map((band) => {
    const count = period[band.key];
    return `${band.label}: <b>${count}</b> (${formatPercent(percentOf(count, period.total))})`;
  });
  const median =
    period.median_wait_days === null
      ? '—'
      : `${String(period.median_wait_days).replace('.', ',')} dia(s)`;
  return [
    `<b>${formatPeriod(granularity, period.period)}</b>: ${period.total} admissões na UTI`,
    ...bands,
    `Mediana da espera (de quem esperou): ${median}`,
  ].join('<br/>');
}

interface ShareBand<K extends string> {
  key: K;
  label: string;
  color: string;
  text: string;
}

type ShareRow<K extends string> = Record<K, number> & { total: number };

/** Barras empilhadas em 100% por período, uma série por faixa. */
function buildShareBarsOption<K extends string, R extends ShareRow<K>>(
  periods: R[],
  labelOf: (period: R) => string,
  bands: readonly ShareBand<K>[],
  tooltip: (period: R) => string,
  theme: ChartTheme,
): EChartsCoreOption {
  return {
    legend: { top: 0, data: bands.map((band) => band.label), textStyle: { color: theme.text } },
    grid: { left: 48, right: 16, top: 44, bottom: 56 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: theme.tooltipBg,
      borderColor: theme.grid,
      textStyle: { color: theme.tooltipText },
      formatter: (raw: unknown) => {
        const [first] = raw as { dataIndex: number }[];
        const period = first ? periods[first.dataIndex] : undefined;
        return period ? tooltip(period) : '';
      },
    },
    xAxis: {
      type: 'category',
      data: periods.map((p) => `${labelOf(p)}\n(n=${p.total})`),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted, interval: periods.length > 12 ? 'auto' : 0 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { color: theme.muted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: theme.grid } },
    },
    series: bands.map((band) => ({
      name: band.label,
      type: 'bar',
      stack: 'total',
      barMaxWidth: 64,
      itemStyle: { color: band.color },
      label: {
        show: true,
        color: band.text,
        formatter: (raw: unknown) => {
          const value = (raw as { value: number }).value;
          return value >= 8 ? `${Math.round(value)}%` : '';
        },
      },
      data: periods.map((period) => percentOf(period[band.key], period.total)),
    })),
  };
}

export function buildIcuAccessOption(
  data: IcuAccessResponse,
  theme: ChartTheme,
): EChartsCoreOption {
  return buildShareBarsOption(
    data.periods,
    (period) => formatPeriod(data.granularity, period.period),
    ICU_BANDS,
    (period) => icuPeriodTooltip(period, data.granularity),
    theme,
  );
}

// ---------------------------------------------------------------------------
// Confirmação diagnóstica — laboratório x clínico, por período
// ---------------------------------------------------------------------------

/** Tons de azul = confirmação laboratorial; âmbar e cinza = critério clínico. */
export const DIAGNOSTIC_BANDS = [
  { key: 'rt_pcr', label: 'RT-PCR', color: BLUE, text: '#FFFFFF' },
  {
    key: 'antigeno_outros',
    label: 'Antígeno e outros laboratoriais',
    color: '#80CAEE',
    text: '#1C2434',
  },
  { key: 'clinico_epi', label: 'Clínico-epidemiológico', color: AMBER, text: '#1C2434' },
  {
    key: 'clinico_outros',
    label: 'Clínico, imagem ou sem critério',
    color: SLATE,
    text: '#1C2434',
  },
] as const;

export function diagnosticPeriodTooltip(
  period: DiagnosticMethodsPeriod,
  granularity: IcuGranularity,
): string {
  const bands = DIAGNOSTIC_BANDS.map((band) => {
    const count = period[band.key];
    return `${band.label}: <b>${count}</b> (${formatPercent(percentOf(count, period.total))})`;
  });
  return [
    `<b>${formatPeriod(granularity, period.period)}</b>: ${period.total} casos`,
    ...bands,
  ].join('<br/>');
}

export function buildDiagnosticMethodsOption(
  data: DiagnosticMethodsResponse,
  theme: ChartTheme,
): EChartsCoreOption {
  return buildShareBarsOption(
    data.periods,
    (period) => formatPeriod(data.granularity, period.period),
    DIAGNOSTIC_BANDS,
    (period) => diagnosticPeriodTooltip(period, data.granularity),
    theme,
  );
}

// ---------------------------------------------------------------------------
// Infecção hospitalar — % por período, com média e limite de alerta
// ---------------------------------------------------------------------------

export function nosocomialTooltip(period: NosocomialPeriod, granularity: IcuGranularity): string {
  const lines = [
    `<b>${formatPeriod(granularity, period.period)}</b>`,
    `Infecção hospitalar: <b>${period.nosocomial}</b> de ${period.known} casos (${formatPercent(period.pct)})`,
  ];
  if (period.alert) lines.push('<b>Acima do limite de alerta</b>');
  return lines.join('<br/>');
}

const referenceLine = (name: string, value: number, count: number, color: string) => ({
  name,
  type: 'line',
  symbol: 'none',
  silent: true,
  lineStyle: { type: 'dashed', width: 2, color },
  data: Array.from({ length: count }, () => value),
});

export function buildNosocomialOption(
  data: NosocomialRiskResponse,
  theme: ChartTheme,
): EChartsCoreOption {
  const { periods, granularity } = data;
  const series: object[] = [
    {
      name: 'Infecção hospitalar',
      type: 'bar',
      barMaxWidth: 56,
      data: periods.map((period) => ({
        value: period.pct,
        itemStyle: { color: period.alert ? RED : BLUE },
      })),
      label: {
        show: true,
        position: 'top',
        color: theme.text,
        formatter: (raw: unknown) => formatPercent((raw as { value: number }).value),
      },
    },
  ];
  if (data.mean_pct !== null) {
    series.push(referenceLine('Média dos períodos', data.mean_pct, periods.length, theme.muted));
  }
  if (data.alert_limit_pct !== null) {
    series.push(referenceLine('Limite de alerta', data.alert_limit_pct, periods.length, RED));
  }

  return {
    legend: {
      top: 0,
      data: series.map((serie) => (serie as { name: string }).name),
      textStyle: { color: theme.text },
    },
    grid: { left: 48, right: 16, top: 44, bottom: 56 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: theme.tooltipBg,
      borderColor: theme.grid,
      textStyle: { color: theme.tooltipText },
      formatter: (raw: unknown) => {
        const [first] = raw as { dataIndex: number }[];
        const period = first ? periods[first.dataIndex] : undefined;
        return period ? nosocomialTooltip(period, granularity) : '';
      },
    },
    xAxis: {
      type: 'category',
      data: periods.map((p) => `${formatPeriod(granularity, p.period)}\n(n=${p.known})`),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted, interval: periods.length > 12 ? 'auto' : 0 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      axisLabel: { color: theme.muted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: theme.grid } },
    },
    series,
  };
}

// ---------------------------------------------------------------------------
// Letalidade por método de confirmação — barras horizontais ordenadas
// ---------------------------------------------------------------------------

export function lethalityTooltip(row: DiagnosticLethalityMethod): string {
  const days =
    row.median_days === null ? '—' : `${String(row.median_days).replace('.', ',')} dia(s)`;
  return [
    `<b>${row.method}</b>`,
    `Letalidade: <b>${formatPercent(row.cfr)}</b> (${row.deaths} óbitos em ${row.resolved} casos com desfecho)`,
    `Tempo mediano da notificação ao desfecho: ${days}`,
    `Foram para a UTI: ${formatPercent(row.icu_pct)}`,
  ].join('<br/>');
}

export function buildDiagnosticLethalityOption(
  data: DiagnosticLethalityResponse,
  theme: ChartTheme,
): EChartsCoreOption {
  // Ordem crescente: a maior letalidade fica no topo do gráfico.
  const rows = [...data.methods].sort((a, b) => a.cfr - b.cfr);
  const overall = data.overall.cfr;
  const highest = Math.max(10, ...rows.map((row) => row.cfr));

  return {
    grid: { left: 170, right: 120, top: 8, bottom: 32 },
    tooltip: {
      trigger: 'item',
      backgroundColor: theme.tooltipBg,
      borderColor: theme.grid,
      textStyle: { color: theme.tooltipText },
      formatter: (raw: unknown) => {
        const row = (raw as { data?: { row?: DiagnosticLethalityMethod } }).data?.row;
        return row ? lethalityTooltip(row) : '';
      },
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: Math.ceil(highest / 10) * 10,
      axisLabel: { color: theme.muted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: theme.grid } },
    },
    yAxis: {
      type: 'category',
      data: rows.map((row) => row.method),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.text },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 28,
        data: rows.map((row) => ({
          value: row.cfr,
          row,
          itemStyle: { color: overall !== null && row.cfr > overall ? RED : BLUE },
        })),
        label: {
          show: true,
          position: 'right',
          color: theme.text,
          formatter: (raw: unknown) => {
            const row = (raw as { data: { row: DiagnosticLethalityMethod } }).data.row;
            return `${formatPercent(row.cfr)} (n=${row.resolved})`;
          },
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Positividade por tipo de amostra — barras horizontais
// ---------------------------------------------------------------------------

export function samplePositivityTooltip(row: SamplePositivityRow): string {
  return [
    `<b>${row.sample_type}</b>`,
    `Positividade: <b>${formatPercent(row.positivity_pct)}</b>`,
    `${row.positive} positivos em ${row.tested} casos com resultado`,
  ].join('<br/>');
}

export function buildSamplePositivityOption(
  data: SamplePositivityResponse,
  theme: ChartTheme,
): EChartsCoreOption {
  // Ordem crescente de volume: o tipo mais testado fica no topo.
  const rows = [...data.types].sort((a, b) => a.tested - b.tested);

  return {
    grid: { left: 180, right: 110, top: 8, bottom: 32 },
    tooltip: {
      trigger: 'item',
      backgroundColor: theme.tooltipBg,
      borderColor: theme.grid,
      textStyle: { color: theme.tooltipText },
      formatter: (raw: unknown) => {
        const row = (raw as { data?: { row?: SamplePositivityRow } }).data?.row;
        return row ? samplePositivityTooltip(row) : '';
      },
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { color: theme.muted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: theme.grid } },
    },
    yAxis: {
      type: 'category',
      data: rows.map((row) => row.sample_type),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.text },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 28,
        itemStyle: { color: BLUE },
        data: rows.map((row) => ({ value: row.positivity_pct, row })),
        label: {
          show: true,
          position: 'right',
          color: theme.text,
          formatter: (raw: unknown) => {
            const row = (raw as { data: { row: SamplePositivityRow } }).data.row;
            return `${formatPercent(row.positivity_pct)} (n=${row.tested})`;
          },
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Antiviral — cura e óbito por rapidez do início do tratamento
// ---------------------------------------------------------------------------

export const ANTIVIRAL_BANDS = [
  { key: 'cure', label: 'Cura', color: GREEN, text: '#FFFFFF' },
  { key: 'death', label: 'Óbito', color: RED, text: '#FFFFFF' },
] as const;

export function antiviralWindowTooltip(window: AntiviralWindow): string {
  const lines = ANTIVIRAL_BANDS.map((band) => {
    const count = window[band.key];
    return `${band.label}: <b>${count}</b> (${formatPercent(percentOf(count, window.total))})`;
  });
  return [`<b>${window.label}</b>: ${window.total} casos com desfecho`, ...lines].join('<br/>');
}

export function buildAntiviralWindowsOption(
  data: AntiviralWindowsResponse,
  theme: ChartTheme,
): EChartsCoreOption {
  const windows = data.windows.filter((window) => window.total > 0);
  const option = buildShareBarsOption(
    windows,
    (window) => window.label,
    ANTIVIRAL_BANDS,
    antiviralWindowTooltip,
    theme,
  ) as { grid: object };
  return { ...option, grid: { left: 48, right: 16, top: 44, bottom: 56 } };
}

// ---------------------------------------------------------------------------
// Imagem e gravidade — % que foi para a UTI e % que morreu, por resultado
// ---------------------------------------------------------------------------

export function imagingTooltip(row: ImagingFinding): string {
  const lethality =
    row.death_pct === null
      ? '—'
      : `${formatPercent(row.death_pct)} (${row.deaths} óbitos em ${row.resolved} casos com desfecho)`;
  return [
    `<b>${row.finding}</b>: ${row.total} casos`,
    `Foram para a UTI: <b>${formatPercent(row.icu_pct)}</b>`,
    `Letalidade: <b>${lethality}</b>`,
  ].join('<br/>');
}

export function buildImagingOption(rows: ImagingFinding[], theme: ChartTheme): EChartsCoreOption {
  // Ordem crescente de letalidade: o achado mais letal fica no topo.
  const sorted = [...rows].sort((a, b) => (a.death_pct ?? 0) - (b.death_pct ?? 0));
  const series = (name: string, color: string, value: (row: ImagingFinding) => number) => ({
    name,
    type: 'bar',
    barMaxWidth: 18,
    itemStyle: { color },
    data: sorted.map((row) => ({ value: value(row), row })),
    label: {
      show: true,
      position: 'right',
      color: theme.text,
      formatter: (raw: unknown) => `${Math.round((raw as { value: number }).value)}%`,
    },
  });

  return {
    legend: {
      top: 0,
      data: ['Foram para a UTI', 'Morreram'],
      textStyle: { color: theme.text },
    },
    grid: { left: 190, right: 48, top: 36, bottom: 28 },
    tooltip: {
      trigger: 'item',
      backgroundColor: theme.tooltipBg,
      borderColor: theme.grid,
      textStyle: { color: theme.tooltipText },
      formatter: (raw: unknown) => {
        const row = (raw as { data?: { row?: ImagingFinding } }).data?.row;
        return row ? imagingTooltip(row) : '';
      },
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { color: theme.muted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: theme.grid } },
    },
    yAxis: {
      type: 'category',
      data: sorted.map((row) => `${row.finding} (n=${row.total})`),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.text },
    },
    series: [
      series('Foram para a UTI', BLUE, (row) => row.icu_pct),
      series('Morreram', RED, (row) => row.death_pct ?? 0),
    ],
  };
}

// ---------------------------------------------------------------------------
// Gravidade e letalidade por faixa etária — barras empilhadas + linhas de CFR
// ---------------------------------------------------------------------------

const AGENT_COLORS: Record<string, string> = {
  VSR: '#0F766E',
  Influenza: '#2563EB',
  'COVID-19': '#EA580C',
  'Outros Vírus': GREEN,
  'Outro Agente': '#B91C1C',
  'Não Especificada': SLATE,
};

export const SEVERITY_BANDS = [
  { key: 'death', label: 'Óbito', color: RED },
  { key: 'uti', label: 'UTI (Sobrevivente)', color: AMBER },
  { key: 'ward', label: 'Enfermaria/Não Internado', color: SLATE },
] as const;

type SeverityBandKey = (typeof SEVERITY_BANDS)[number]['key'];

export function severityRates(row: SeverityByAgePoint): Record<SeverityBandKey, number> {
  return {
    death: row.death_rate,
    uti: Math.max(0, row.uti_rate - row.death_rate),
    ward: Math.max(0, 100 - Math.max(row.uti_rate, row.death_rate)),
  };
}

interface AxisTooltipParam {
  name: string;
  seriesName: string;
  seriesType: string;
  marker: string;
  value: number;
  color: string;
}

export function severityLethalityTooltip(
  params: AxisTooltipParam[],
  rows: SeverityByAgeResponse,
): string {
  if (params.length === 0) return '';

  const ageGroup = params[0].name;
  const row = rows.find((item) => item.age_group === ageGroup);
  const rates = row ? severityRates(row) : null;

  const lines = params.map((param) => {
    const label = `${param.marker} ${param.seriesName}`;
    if (param.seriesType === 'bar') {
      const band = SEVERITY_BANDS.find((item) => item.label === param.seriesName);
      const rate = rates && band ? formatPercent(rates[band.key]) : '—';
      return `${label}: <b>${param.value}</b> (${rate})`;
    }
    return `${label}: <b style="color:${param.color}">${formatPercent(Number(param.value))}</b>`;
  });

  return [`<b>${ageGroup}</b>`, row ? `Total de casos: <b>${row.total_cases}</b>` : '', ...lines]
    .filter(Boolean)
    .join('<br/>');
}

export function buildSeverityLethalityOption(
  severity: SeverityByAgeResponse,
  lethality: LethalityAgeAgentResponse | null,
  theme: ChartTheme,
): EChartsCoreOption {
  const ageGroups = severity.map((row) => row.age_group);

  const barSeries = SEVERITY_BANDS.map((band) => ({
    name: band.label,
    type: 'bar',
    stack: 'severity',
    yAxisIndex: 0,
    itemStyle: { color: band.color },
    data: severity.map((row) => Math.round(row.total_cases * (severityRates(row)[band.key] / 100))),
  }));

  // Uma linha de CFR por agente; agentes sem nenhum valor > 0 ficam de fora.
  const lineSeries = (lethality?.agents ?? []).flatMap((agent, agentIndex) => {
    const points = ageGroups.map((ageGroup) => {
      const bandIndex = lethality?.age_bands.indexOf(ageGroup) ?? -1;
      // null = poucos casos para estimar: a linha fica com lacuna em vez de cair a 0%.
      return bandIndex === -1 ? null : (lethality?.matrix[agentIndex]?.[bandIndex] ?? null);
    });
    if (!points.some((value) => value !== null && value > 0)) return [];

    const color = AGENT_COLORS[agent] ?? theme.muted;
    return [
      {
        name: `${agent} (CFR)`,
        type: 'line',
        yAxisIndex: 1,
        z: 10,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2, color },
        itemStyle: { color },
        data: points,
      },
    ];
  });

  const series = [...barSeries, ...lineSeries];
  const axisLine = { show: true, lineStyle: { color: theme.grid } };

  return {
    legend: {
      type: 'scroll',
      bottom: 0,
      data: series.map((item) => item.name),
      textStyle: { color: theme.text, fontSize: 11 },
    },
    grid: { left: 16, right: 16, top: 40, bottom: 56, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: theme.tooltipBg,
      borderColor: theme.grid,
      textStyle: { color: theme.tooltipText },
      formatter: (raw: unknown) => severityLethalityTooltip(raw as AxisTooltipParam[], severity),
    },
    xAxis: {
      type: 'category',
      data: ageGroups,
      axisTick: { show: false },
      axisLine,
      axisLabel: { color: theme.muted, rotate: 25 },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Volume de casos',
        nameTextStyle: { color: theme.muted },
        axisLine,
        axisLabel: { color: theme.muted },
        splitLine: { lineStyle: { color: theme.grid, type: 'dashed' } },
      },
      {
        type: 'value',
        name: 'Letalidade (CFR %)',
        nameTextStyle: { color: theme.muted },
        min: 0,
        max: 100,
        axisLine,
        axisLabel: { color: theme.muted, formatter: '{value}%' },
        splitLine: { show: false },
      },
    ],
    series,
  };
}