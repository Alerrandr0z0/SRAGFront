import type {
  AntiviralWindow,
  AntiviralWindowsResponse,
  DiagnosticLethalityMethod,
  DiagnosticLethalityResponse,
  DiagnosticMethodsPeriod,
  DiagnosticMethodsResponse,
  IcuAccessPeriod,
  IcuAccessResponse,
  IcuGranularity,
  ImagingFinding,
  LethalityAgeAgentResponse,
  LabeledCount,
  MaternalGroup,
  MaternalOutcomesResponse,
  NosocomialPeriod,
  NosocomialRiskResponse,
  NotificationDelayBairro,
  NotificationDelayStatus,
  SamplePositivityResponse,
  SamplePositivityRow,
  SeverityByAgePoint,
  SeverityByAgeResponse,
  StayCurvePoint,
  SymptomAgent,
  SymptomsByAgentResponse,
  UnitDelayRow,
} from '../../../service/srag/sragAnalytics';
import type { ChartTheme } from './chartTheme';
import type { EChartsCoreOption } from './echartsCore';

const RED = '#DC2626';
const BLUE = '#3C50E0';
const GREEN = '#10B981';
const AMBER = '#F59E0B';
const SLATE = '#94A3B8';

// ---------------------------------------------------------------------------
// Sintomas por agente — barras agrupadas (o que diferencia COVID-19, Influenza e VSR)
// ---------------------------------------------------------------------------

const SYMPTOMS_SHOWN = 8;

/** Agentes sem casos no recorte ficam de fora do gráfico (só gerariam barras vazias). */
export function agentsWithCases(data: SymptomsByAgentResponse): SymptomAgent[] {
  return data.agents.filter((agent) => agent.cases > 0);
}

export function agentLegendName(agent: SymptomAgent): string {
  return `${agent.label} (${agent.cases.toLocaleString('pt-BR')} casos)`;
}

export function symptomsTooltip(
  data: SymptomsByAgentResponse,
  symptomIndex: number,
  seriesName?: string,
): string {
  const header = `<b>${data.symptoms[symptomIndex] ?? ''}</b>`;
  const lines = agentsWithCases(data).map((agent) => {
    const text = `${agent.label}: <b>${agent.pct[symptomIndex] ?? 0}%</b> (${agent.count[symptomIndex] ?? 0} de ${agent.cases})`;
    return agentLegendName(agent) === seriesName ? `<u>${text}</u>` : text;
  });
  return [header, ...lines].join('<br/>');
}

export function buildSymptomsByAgentOption(
  data: SymptomsByAgentResponse,
  theme: ChartTheme,
  limit = SYMPTOMS_SHOWN,
): EChartsCoreOption {
  const agents = agentsWithCases(data);
  const symptoms = data.symptoms.slice(0, limit);

  return {
    legend: { top: 0, textStyle: { color: theme.text } },
    grid: { left: 150, right: 44, top: 44, bottom: 24 },
    tooltip: {
      trigger: 'item',
      backgroundColor: theme.tooltipBg,
      borderColor: theme.grid,
      textStyle: { color: theme.tooltipText },
      formatter: (raw: unknown) => {
        const { dataIndex, seriesName } = raw as { dataIndex: number; seriesName?: string };
        return symptomsTooltip(data, dataIndex, seriesName);
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
      inverse: true,
      data: symptoms,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.text, width: 134, overflow: 'truncate' },
    },
    series: agents.map((agent) => ({
      name: agentLegendName(agent),
      type: 'bar',
      barMaxWidth: 14,
      itemStyle: { color: AGENT_COLORS[agent.label] ?? theme.muted },
      label: {
        show: true,
        position: 'right',
        color: theme.muted,
        fontSize: 10,
        formatter: (raw: unknown) => `${(raw as { value: number }).value}%`,
      },
      data: agent.pct.slice(0, limit),
    })),
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
  return [
    `<b>${formatPeriodLong(granularity, period.period)}</b>`,
    `Infecção hospitalar: <b>${period.nosocomial}</b> de ${period.known} casos (${formatPercent(period.pct)})`,
  ].join('<br/>');
}

/** "2024-Q1" → "1º trimestre de 2024". Outras granularidades seguem o formatPeriod. */
function formatPeriodLong(granularity: IcuGranularity, key: string): string {
  if (granularity === 'quarter') {
    const [year, quarter] = key.split('-Q');
    return `${quarter}º trimestre de ${year}`;
  }
  return formatPeriod(granularity, key);
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

export const AGENT_COLORS: Record<string, string> = {
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

// Gravidade por faixa etária

export function buildSeverityOption(
  severity: SeverityByAgeResponse,
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

  const series = [...barSeries];

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
      axisLabel: { color: theme.muted, rotate: 25 },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Volume de casos',
        nameTextStyle: { color: theme.muted },
        axisLabel: { color: theme.muted },
        splitLine: { lineStyle: { color: theme.grid, type: 'dashed' } },
      },
      {
        type: 'value',
        name: 'Letalidade (CFR %)',
        nameTextStyle: { color: theme.muted },
        min: 0,
        max: 100,
        axisLabel: { color: theme.muted, formatter: '{value}%' },
        splitLine: { show: false },
      },
    ],
    series,
  };
}

// ---------------------------------------------------------------------------
// Letalidade por faixa etária — um gráfico de barras pequeno para cada agente
// ---------------------------------------------------------------------------

/** Agentes que ganham um gráfico, na ordem em que aparecem lado a lado. */
export const LETHALITY_AGENTS = [
  'COVID-19',
  'Influenza',
  'VSR',
  'Outros Vírus',
  'Não Especificada',
] as const;

export interface LethalityPanel {
  agent: string;
  color: string;
  /** null quando o agente não tem nenhum caso com desfecho nos filtros atuais. */
  option: EChartsCoreOption | null;
}

interface LethalityTooltipParam {
  name: string;
  marker: string;
  value: number | null;
}

/** "0 anos" → "0", "1-4 anos" → "1-4", "80+ anos" → "80+": cabe no eixo de um gráfico pequeno. */
const shortBand = (band: string) => band.replace(/ anos?$/, '');

export function lethalityPanelTooltip(agent: string, params: LethalityTooltipParam[]): string {
  const [first] = params;
  if (!first) return '';
  return [
    `<b>${first.name} anos</b>`,
    `${first.marker} ${agent}: <b>${formatPercent(Number(first.value ?? 0))}</b>`,
  ].join('<br/>');
}

/** Barras de CFR (%) de um único agente, uma por faixa etária. Eixo fixo em 0–100%. */
export function buildLethalityAgentOption(
  agent: string,
  ageBands: string[],
  values: number[],
  color: string,
  theme: ChartTheme,
): EChartsCoreOption {
  return {
    grid: { left: 4, right: 8, top: 12, bottom: 4, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: theme.tooltipBg,
      borderColor: theme.grid,
      textStyle: { color: theme.tooltipText },
      formatter: (raw: unknown) => lethalityPanelTooltip(agent, raw as LethalityTooltipParam[]),
    },
    xAxis: {
      type: 'category',
      data: ageBands,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: {
        color: theme.muted,
        fontSize: 10,
        interval: 0,
        rotate: 60,
        formatter: shortBand,
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { color: theme.muted, fontSize: 10, formatter: '{value}%' },
      splitLine: { lineStyle: { color: theme.grid, type: 'dashed' } },
    },
    series: [
      {
        name: agent,
        type: 'bar',
        barMaxWidth: 14,
        itemStyle: { color, borderRadius: [2, 2, 0, 0] },
        data: values,
      },
    ],
  };
}

/** Um painel por agente de LETHALITY_AGENTS; agente sem casos nos filtros vem com option null. */
export function buildLethalityPanels(
  lethality: LethalityAgeAgentResponse | null,
  theme: ChartTheme,
): LethalityPanel[] {
  if (!lethality) return [];

  return LETHALITY_AGENTS.map((agent) => {
    const index = lethality.agents.indexOf(agent);
    const row = index === -1 ? undefined : lethality.matrix[index];
    const color = AGENT_COLORS[agent] ?? theme.muted;
    const values = row?.map((value) => value ?? 0);
    return {
      agent,
      color,
      option: values
        ? buildLethalityAgentOption(agent, lethality.age_bands, values, color, theme)
        : null,
    };
  });
}
// Atraso de notificação por bairro — barras horizontais com limite aceitável
// ---------------------------------------------------------------------------

const DELAY_COLORS: Record<NotificationDelayStatus, string> = {
  adequado: GREEN,
  atencao: AMBER,
  critico: RED,
};

const formatNumber = (value: number) => String(value).replace('.', ',');

export function notificationDelayTooltip(row: NotificationDelayBairro, limitDays: number): string {
  return [
    `<b>${row.bairro}</b>: ${row.total} casos`,
    `Mediana: <b>${formatNumber(row.median_days)} dias</b> (média ${formatNumber(row.mean_days)})`,
    `Notificados em até ${limitDays} dias: <b>${formatPercent(row.within_limit_pct)}</b>`,
  ].join('<br/>');
}

export function buildNotificationDelayOption(
  rows: NotificationDelayBairro[],
  limitDays: number,
  theme: ChartTheme,
  labelWidth = 190,
): EChartsCoreOption {
  const longest = Math.max(0, ...rows.map((row) => row.median_days));
  const limitName = `Limite aceitável: ${limitDays} dias`;

  return {
    legend: {
      top: 0,
      data: [limitName],
      textStyle: { color: theme.text },
    },

    grid: { left: labelWidth, right: 120, top: 44, bottom: 32 },
    tooltip: {
      trigger: 'item',
      backgroundColor: theme.tooltipBg,
      borderColor: theme.grid,
      textStyle: { color: theme.tooltipText },
      formatter: (raw: unknown) => {
        const row = (raw as { data?: { row?: NotificationDelayBairro } }).data?.row;
        return row ? notificationDelayTooltip(row, limitDays) : '';
      },
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: Math.max(limitDays + 3, Math.ceil(longest) + 3),
      axisLabel: { color: theme.muted, formatter: '{value} d' },
      splitLine: { lineStyle: { color: theme.grid } },
    },
    // inverse: a primeira linha (maior atraso) fica no topo.
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map((row) => row.bairro),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.text, width: labelWidth - 16, overflow: 'truncate' },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 22,
        data: rows.map((row) => ({
          value: row.median_days,
          row,
          itemStyle: { color: DELAY_COLORS[row.status] ?? SLATE },
        })),
        label: {
          show: true,
          position: 'right',
          color: theme.text,
          formatter: (raw: unknown) => {
            const row = (raw as { data: { row: NotificationDelayBairro } }).data.row;
            return `${formatNumber(row.median_days)} dias (n=${row.total})`;
          },
        },
      },
      {
        name: limitName,
        type: 'line',
        data: [],
        lineStyle: { type: 'dashed', width: 2, color: theme.muted },
        itemStyle: { color: theme.muted },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', width: 2, color: theme.muted },
          label: {
            formatter: `Limite aceitável: ${limitDays} dias`, position: 'end',
            color: theme.muted,
          },
          data: [{ xAxis: limitDays }]
        },
      }
    ],
  };
}

// ---------------------------------------------------------------------------
// Desfecho por grupo materno — barras empilhadas em 100%
// ---------------------------------------------------------------------------

export const MATERNAL_BANDS = [
  { key: 'cure', label: 'Cura sem UTI', color: GREEN, text: '#FFFFFF' },
  { key: 'icu', label: 'UTI e sobreviveu', color: AMBER, text: '#1C2434' },
  { key: 'death', label: 'Óbito', color: RED, text: '#FFFFFF' },
  { key: 'other', label: 'Outro ou em aberto', color: SLATE, text: '#1C2434' },
] as const;

export function maternalTooltip(group: MaternalGroup, minCases: number): string {
  const lines = MATERNAL_BANDS.map((band) => {
    const count = group[band.key];
    return `${band.label}: <b>${count}</b> (${formatPercent(percentOf(count, group.total))})`;
  });
  const warning =
    group.total < minCases
      ? ['<i>Poucos casos: o percentual varia muito com 1 paciente a mais ou a menos.</i>']
      : [];
  return [`<b>${group.group}</b>: ${group.total} casos`, ...lines, ...warning].join('<br/>');
}

export function buildMaternalOutcomesOption(
  data: MaternalOutcomesResponse,
  theme: ChartTheme,
): EChartsCoreOption {
  const groups = data.groups.filter((group) => group.total > 0);
  const option = buildShareBarsOption(
    groups,
    (group) => (group.total < data.min_cases ? `${group.group} *` : group.group),
    MATERNAL_BANDS,
    (group) => maternalTooltip(group, data.min_cases),
    theme,
  ) as { grid: object };
  return { ...option, grid: { left: 48, right: 16, top: 44, bottom: 56 } };
}

// ---------------------------------------------------------------------------
// Ranking simples — barras horizontais com contagem e percentual
// ---------------------------------------------------------------------------

export interface RankedBarsConfig {
  /** Base do percentual: total de casos que responderam à pergunta. */
  base: number;
  color?: string;
  /** `desc` ordena do maior ao menor; `keep` respeita a ordem recebida (etapas). */
  order?: 'desc' | 'keep';
  /** Espaço à esquerda para os rótulos longos. */
  labelWidth?: number;
}

export function rankedBarsRows(items: LabeledCount[], order: 'desc' | 'keep'): LabeledCount[] {
  return order === 'desc' ? [...items].sort((a, b) => b.count - a.count) : [...items];
}

export function rankedBarTooltip(item: LabeledCount, base: number): string {
  return `<b>${item.label}</b><br/>${item.count.toLocaleString('pt-BR')} casos (${formatPercent(percentOf(item.count, base))})`;
}

export function buildRankedBarsOption(
  items: LabeledCount[],
  theme: ChartTheme,
  { base, color = BLUE, order = 'desc', labelWidth = 200 }: RankedBarsConfig,
): EChartsCoreOption {
  const rows = rankedBarsRows(items, order);
  return {
    grid: { left: labelWidth, right: 110, top: 8, bottom: 24 },
    tooltip: {
      trigger: 'item',
      backgroundColor: theme.tooltipBg,
      borderColor: theme.grid,
      textStyle: { color: theme.tooltipText },
      formatter: (raw: unknown) => {
        const item = (raw as { data?: { item?: LabeledCount } }).data?.item;
        return item ? rankedBarTooltip(item, base) : '';
      },
    },
    xAxis: {
      type: 'value',
      min: 0,
      axisLabel: { color: theme.muted },
      splitLine: { lineStyle: { color: theme.grid } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map((row) => row.label),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.text, width: labelWidth - 16, overflow: 'truncate' },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 26,
        itemStyle: { color },
        data: rows.map((item) => ({ value: item.count, item })),
        label: {
          show: true,
          position: 'right',
          color: theme.text,
          formatter: (raw: unknown) => {
            const item = (raw as { data: { item: LabeledCount } }).data.item;
            return `${item.count.toLocaleString('pt-BR')} (${formatPercent(percentOf(item.count, base))})`;
          },
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Atraso de notificação por unidade — mesmas barras do atraso por bairro
// ---------------------------------------------------------------------------

/** O atraso por unidade usa o mesmo gráfico do atraso por bairro: só muda o nome da linha. */
export function unitDelayAsRows(units: UnitDelayRow[]): NotificationDelayBairro[] {
  return units.map(({ unit, id_unidade: _id, ...rest }) => ({ ...rest, bairro: unit }));
}

export function buildUnitDelayOption(
  units: UnitDelayRow[],
  limitDays: number,
  theme: ChartTheme,
): EChartsCoreOption {
  return buildNotificationDelayOption(unitDelayAsRows(units), limitDays, theme, 300);
}

// ---------------------------------------------------------------------------
// Tempo de internação — quanto já teve alta ou morreu até cada dia
// ---------------------------------------------------------------------------

export function stayCurveTooltip(point: StayCurvePoint): string {
  return [
    `<b>Até o ${point.day}º dia de internação</b>`,
    `Já tiveram alta: <b>${formatPercent(point.cure_pct)}</b>`,
    `Morreram: <b>${formatPercent(point.death_pct)}</b>`,
  ].join('<br/>');
}

export function buildStayCurveOption(
  curve: StayCurvePoint[],
  theme: ChartTheme,
): EChartsCoreOption {
  const line = (name: string, color: string, values: number[]) => ({
    name,
    type: 'line',
    showSymbol: false,
    smooth: false,
    lineStyle: { width: 3, color },
    itemStyle: { color },
    areaStyle: { color, opacity: 0.1 },
    data: values,
  });
  return {
    legend: {
      top: 0,
      data: ['Já tiveram alta', 'Morreram'],
      textStyle: { color: theme.text },
    },
    grid: { left: 56, right: 24, top: 44, bottom: 56 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: theme.tooltipBg,
      borderColor: theme.grid,
      textStyle: { color: theme.tooltipText },
      formatter: (raw: unknown) => {
        const [first] = raw as { dataIndex: number }[];
        const point = first ? curve[first.dataIndex] : undefined;
        return point ? stayCurveTooltip(point) : '';
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: curve.map((point) => point.day),
      name: 'Dias de internação',
      nameLocation: 'middle',
      nameGap: 32,
      nameTextStyle: { color: theme.muted },
      axisLabel: { color: theme.muted, interval: 4 },
      axisLine: { lineStyle: { color: theme.grid } },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { color: theme.muted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: theme.grid } },
    },
    series: [
      line(
        'Já tiveram alta',
        GREEN,
        curve.map((point) => point.cure_pct),
      ),
      line(
        'Morreram',
        RED,
        curve.map((point) => point.death_pct),
      ),
    ],
  };
}
