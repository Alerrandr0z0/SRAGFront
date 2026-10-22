import { describe, expect, it } from 'vitest';
import {
  antiviralWindowTooltip,
  buildAntiviralWindowsOption,
  buildDiagnosticLethalityOption,
  buildDiagnosticMethodsOption,
  buildHeatmapOption,
  buildIcuAccessOption,
  buildImagingOption,
  buildMaternalOutcomesOption,
  buildNosocomialOption,
  buildNotificationDelayOption,
  buildOddsRatioOption,
  buildRankedBarsOption,
  buildSamplePositivityOption,
  buildSankeyOption,
  buildStayCurveOption,
  buildUnitDelayOption,
  diagnosticPeriodTooltip,
  formatPercent,
  formatPeriod,
  heatmapLabel,
  icuPeriodTooltip,
  imagingTooltip,
  lethalityTooltip,
  maternalTooltip,
  nosocomialTooltip,
  notificationDelayTooltip,
  oddsRatioColor,
  percentOf,
  prepareOddsRatio,
  rankedBarTooltip,
  rankedBarsRows,
  samplePositivityTooltip,
  sankeyTooltip,
  stayCurveTooltip,
  unitDelayAsRows,
} from '../../src/components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../src/components/Charts/Analytics/chartTheme';
import type {
  AntiviralWindowsResponse,
  DiagnosticLethalityResponse,
  DiagnosticMethodsResponse,
  IcuAccessResponse,
  ImagingFinding,
  MaternalOutcomesResponse,
  NosocomialRiskResponse,
  NotificationDelayBairro,
  OddsRatioRow,
  SamplePositivityResponse,
} from '../../src/service/srag/sragAnalytics';

const theme = chartTheme(false);

const row = (overrides: Partial<OddsRatioRow>): OddsRatioRow => ({
  name: 'Diabetes',
  value: 15,
  deaths: 10,
  lethality: 66.67,
  prevalence: 37.5,
  odds_ratio: 8,
  ci_lower: 1.87,
  ci_upper: 34.2,
  ...overrides,
});

describe('prepareOddsRatio', () => {
  it('separa fatores sem OR estimável', () => {
    const plot = prepareOddsRatio([
      row({ name: 'Diabetes' }),
      row({ name: 'Asma', value: 0, odds_ratio: 0, ci_lower: 0, ci_upper: 0 }),
    ]);
    expect(plot.rows.map((r) => r.name)).toEqual(['Diabetes']);
    expect(plot.omitted).toEqual(['Asma']);
  });

  it('ordena por OR crescente (o maior fica no topo do gráfico)', () => {
    const plot = prepareOddsRatio([
      row({ name: 'A', odds_ratio: 5 }),
      row({ name: 'B', odds_ratio: 1.2 }),
      row({ name: 'C', odds_ratio: 9 }),
    ]);
    expect(plot.rows.map((r) => r.name)).toEqual(['B', 'A', 'C']);
  });

  it('calcula limites do eixo em potências de 10', () => {
    expect(prepareOddsRatio([row({ ci_upper: 34.2 })])).toMatchObject({
      axisMin: 0.1,
      axisMax: 100,
    });
    expect(prepareOddsRatio([row({ ci_lower: 0.04 })]).axisMin).toBe(0.01);
    expect(prepareOddsRatio([row({ odds_ratio: 3, ci_upper: 4 })]).axisMax).toBe(10);
  });

  it('limita o eixo a 1000', () => {
    expect(prepareOddsRatio([row({ ci_upper: 99999 })]).axisMax).toBe(1000);
  });

  it('não quebra sem nenhum fator estimável', () => {
    const plot = prepareOddsRatio([]);
    expect(plot.rows).toEqual([]);
    expect(plot.axisMin).toBe(0.1);
  });
});

describe('oddsRatioColor', () => {
  it('classifica pela significância do intervalo de confiança', () => {
    expect(oddsRatioColor(row({ ci_lower: 1.5 }))).toBe('#DC2626');
    expect(oddsRatioColor(row({ odds_ratio: 0.4, ci_lower: 0.1, ci_upper: 0.8 }))).toBe('#3C50E0');
    expect(oddsRatioColor(row({ ci_lower: 0.5, ci_upper: 3 }))).toBe('#94A3B8');
  });
});

describe('buildOddsRatioOption', () => {
  it('mantém todos os valores dentro dos limites do eixo log', () => {
    const plot = prepareOddsRatio([row({ ci_lower: 0.0001, ci_upper: 99999 })]);
    const option = buildOddsRatioOption(plot, theme) as {
      series: { data: { value: number[] }[] }[];
    };
    const [, lo, hi] = option.series[1].data[0].value.slice(1);
    expect(lo).toBeGreaterThanOrEqual(plot.axisMin);
    expect(hi).toBeLessThanOrEqual(plot.axisMax);
  });
});

describe('buildSankeyOption', () => {
  const flow = {
    nodes: [{ name: 'Comunitária' }, { name: 'Óbito' }, { name: 'Origem (Ignorado)' }],
    links: [{ source: 'Comunitária', target: 'Óbito', value: 3, pct: 25 }],
  };

  it('mapeia nós e ligações e colore pelo significado', () => {
    const option = buildSankeyOption(flow, theme) as {
      series: { data: { name: string; itemStyle: { color: string } }[]; links: unknown[] }[];
    };
    const [serie] = option.series;
    expect(serie.links).toHaveLength(1);
    expect(serie.data.find((n) => n.name === 'Óbito')?.itemStyle.color).toBe('#DC2626');
    expect(serie.data.find((n) => n.name === 'Origem (Ignorado)')?.itemStyle.color).toBe(
      theme.muted,
    );
  });

  it('descreve ligações e nós no tooltip', () => {
    const edge = sankeyTooltip({
      dataType: 'edge',
      data: { source: 'Comunitária', target: 'Óbito', value: 3, pct: 25 },
    });
    expect(edge).toContain('3</b> casos (25% de "Comunitária")');
    expect(sankeyTooltip({ name: 'Cura', value: 7 })).toContain('Cura: <b>7</b> casos');
  });
});

describe('buildHeatmapOption', () => {
  const matrix: [number, number][][] = [
    [
      [50, 2],
      [0, 0],
    ],
  ];

  it('gera uma célula por sintoma × faixa etária', () => {
    const option = buildHeatmapOption(['Febre'], ['Adulto', 'Idoso'], matrix, theme, true) as {
      series: { data: { value: number[] }[] }[];
    };
    expect(option.series[0].data.map((d) => d.value)).toEqual([
      [0, 0, 50, 2],
      [1, 0, 0, 0],
    ]);
  });

  it('mostra "–" quando não há casos no grupo', () => {
    expect(heatmapLabel({ value: [1, 0, 0, 0] })).toBe('–');
    expect(heatmapLabel({ value: [0, 0, 49.6, 2] })).toBe('50%');
  });

  it('esconde os rótulos do eixo y fora do primeiro gráfico', () => {
    const option = buildHeatmapOption(['Febre'], ['Adulto'], [[[10, 1]]], theme, false) as {
      yAxis: { axisLabel: { show: boolean } };
    };
    expect(option.yAxis.axisLabel.show).toBe(false);
  });
});

describe('formatPeriod', () => {
  it('formata ano, trimestre e mês', () => {
    expect(formatPeriod('year', '2024')).toBe('2024');
    expect(formatPeriod('quarter', '2024-Q1')).toBe('T1/2024');
    expect(formatPeriod('month', '2024-03')).toBe('mar/24');
    expect(formatPeriod('month', '2025-12')).toBe('dez/25');
  });
});

describe('percentOf / formatPercent', () => {
  it('calcula a fatia e formata em pt-BR', () => {
    expect(percentOf(30, 60)).toBe(50);
    expect(percentOf(5, 0)).toBe(0);
    expect(formatPercent(77.5)).toBe('77,5%');
    expect(formatPercent(0)).toBe('0,0%');
  });
});

describe('buildIcuAccessOption', () => {
  const stats = { d1_3: 20, d4_7: 6, d8_plus: 4, same_day: 30, total: 60 };
  const data: IcuAccessResponse = {
    granularity: 'year',
    limit_days: 3,
    min_cases: 50,
    summary: {
      ...stats,
      median_wait_days: 2,
      same_day_pct: 50,
      over_limit: 10,
      over_limit_pct: 16.7,
      status: 'adequado',
    },
    periods: [{ ...stats, period: '2024', median_wait_days: 2 }],
  };

  type BarOption = {
    xAxis: { data: string[] };
    series: { name: string; data: number[] }[];
  };

  it('cria uma série por faixa de espera, na ordem do verde ao vermelho', () => {
    const option = buildIcuAccessOption(data, theme) as BarOption;
    expect(option.series.map((serie) => serie.name)).toEqual([
      'Mesmo dia',
      '1 a 3 dias (dentro do limite)',
      '4 a 7 dias',
      'Mais de 7 dias',
    ]);
  });

  it('empilha percentuais que somam 100% por período', () => {
    const option = buildIcuAccessOption(data, theme) as BarOption;
    const values = option.series.map((serie) => serie.data[0]);
    expect(values).toEqual([50, (20 / 60) * 100, 10, (4 / 60) * 100]);
    expect(values.reduce((sum, value) => sum + value, 0)).toBeCloseTo(100);
  });

  it('mostra o n de cada período no rótulo do eixo', () => {
    const option = buildIcuAccessOption(data, theme) as BarOption;
    expect(option.xAxis.data).toEqual(['2024\n(n=60)']);
  });

  it('descreve contagens, percentuais e mediana no tooltip', () => {
    const tooltip = icuPeriodTooltip(data.periods[0], 'year');
    expect(tooltip).toContain('60 admissões na UTI');
    expect(tooltip).toContain('Mesmo dia: <b>30</b> (50,0%)');
    expect(tooltip).toContain('Mediana da espera (de quem esperou): 2 dia(s)');
  });

  it('indica quando ninguém esperou (sem mediana)', () => {
    const tooltip = icuPeriodTooltip({ ...data.periods[0], median_wait_days: null }, 'year');
    expect(tooltip).toContain('de quem esperou): —');
  });
});

describe('buildDiagnosticMethodsOption', () => {
  const counts = { total: 50, rt_pcr: 20, antigeno_outros: 10, clinico_epi: 15, clinico_outros: 5 };
  const data: DiagnosticMethodsResponse = {
    granularity: 'year',
    min_cases: 50,
    summary: { ...counts, laboratory_pct: 60, rt_pcr_pct: 40 },
    periods: [{ ...counts, period: '2024' }],
  };
  type BarOption = { series: { name: string; data: number[] }[] };

  it('empilha as quatro faixas de confirmação somando 100%', () => {
    const option = buildDiagnosticMethodsOption(data, theme) as BarOption;
    expect(option.series.map((serie) => serie.name)).toEqual([
      'RT-PCR',
      'Antígeno e outros laboratoriais',
      'Clínico-epidemiológico',
      'Clínico, imagem ou sem critério',
    ]);
    const values = option.series.map((serie) => serie.data[0]);
    expect(values).toEqual([40, 20, 30, 10]);
  });

  it('descreve as contagens no tooltip', () => {
    const tooltip = diagnosticPeriodTooltip(data.periods[0], 'year');
    expect(tooltip).toContain('50 casos');
    expect(tooltip).toContain('RT-PCR: <b>20</b> (40,0%)');
  });
});

describe('buildNosocomialOption', () => {
  const period = (key: string, pct: number, alert: boolean) => ({
    period: key,
    known: 20,
    nosocomial: Math.round(pct / 5),
    pct,
    alert,
  });
  const base: NosocomialRiskResponse = {
    granularity: 'month',
    min_cases: 20,
    mean_pct: 8,
    alert_limit_pct: 40,
    summary: {
      known: 40,
      nosocomial: 4,
      nosocomial_pct: 10,
      lethality: {
        nosocomial: { resolved: 4, deaths: 2, pct: 50 },
        community: { resolved: 36, deaths: 4, pct: 11.1 },
      },
    },
    periods: [period('2024-01', 5, false), period('2024-02', 60, true)],
  };
  type Option = {
    series: { name: string; data: (number | { value: number; itemStyle: { color: string } })[] }[];
  };

  it('pinta de vermelho só as barras acima do limite de alerta', () => {
    const option = buildNosocomialOption(base, theme) as Option;
    const bars = option.series[0].data as { value: number; itemStyle: { color: string } }[];
    expect(bars.map((bar) => bar.itemStyle.color)).toEqual(['#3C50E0', '#DC2626']);
  });

  it('desenha as linhas de média e de limite de alerta', () => {
    const option = buildNosocomialOption(base, theme) as Option;
    expect(option.series.map((serie) => serie.name)).toEqual([
      'Infecção hospitalar',
      'Média dos períodos',
      'Limite de alerta',
    ]);
    expect(option.series[2].data).toEqual([40, 40]);
  });

  it('omite o limite de alerta quando ele não existe', () => {
    const option = buildNosocomialOption({ ...base, alert_limit_pct: null }, theme) as Option;
    expect(option.series.map((serie) => serie.name)).not.toContain('Limite de alerta');
  });

  it('avisa no tooltip quando o período passou do limite', () => {
    expect(nosocomialTooltip(base.periods[1], 'month')).toContain('Acima do limite de alerta');
    expect(nosocomialTooltip(base.periods[0], 'month')).not.toContain('Acima do limite');
  });
});

describe('buildDiagnosticLethalityOption', () => {
  const method = (name: string, cfr: number) => ({
    method: name,
    cases: 30,
    resolved: 20,
    deaths: Math.round(cfr / 5),
    cfr,
    median_days: 9,
    icu_pct: 40,
  });
  const data: DiagnosticLethalityResponse = {
    min_resolved: 10,
    overall: { cases: 60, resolved: 40, deaths: 12, cfr: 30 },
    methods: [method('A', 50), method('B', 10), method('C', 30)],
    hidden: [],
  };
  type Option = {
    yAxis: { data: string[] };
    series: { data: { value: number; itemStyle: { color: string } }[] }[];
  };

  it('ordena do menos letal ao mais letal, deixando o mais letal no topo', () => {
    const option = buildDiagnosticLethalityOption(data, theme) as Option;
    expect(option.yAxis.data).toEqual(['B', 'C', 'A']);
  });

  it('pinta de vermelho só o que passa da média geral', () => {
    const option = buildDiagnosticLethalityOption(data, theme) as Option;
    expect(option.series[0].data.map((bar) => bar.itemStyle.color)).toEqual([
      '#3C50E0',
      '#3C50E0', // 30% = média: não passa dela
      '#DC2626',
    ]);
  });

  it('descreve letalidade, tempo e UTI no tooltip', () => {
    const tooltip = lethalityTooltip(data.methods[0]);
    expect(tooltip).toContain('Letalidade: <b>50,0%</b> (10 óbitos em 20 casos com desfecho)');
    expect(tooltip).toContain('9 dia(s)');
    expect(tooltip).toContain('Foram para a UTI: 40,0%');
  });

  it('indica quando não há tempo mediano', () => {
    expect(lethalityTooltip({ ...data.methods[0], median_days: null })).toContain('desfecho: —');
  });
});

describe('buildSamplePositivityOption', () => {
  const data: SamplePositivityResponse = {
    min_tested: 10,
    overall: { tested: 32, positive: 16, pct: 50 },
    types: [
      { sample_type: 'Outra', tested: 12, positive: 1, positivity_pct: 8.3 },
      { sample_type: 'Secreção naso/orofaringe', tested: 20, positive: 15, positivity_pct: 75 },
    ],
    hidden: [],
  };
  type Option = {
    yAxis: { data: string[] };
    series: { data: { value: number; row: { tested: number } }[] }[];
  };

  it('deixa o tipo mais testado no topo (ordem crescente de volume)', () => {
    const option = buildSamplePositivityOption(data, theme) as Option;
    expect(option.yAxis.data).toEqual(['Outra', 'Secreção naso/orofaringe']);
    expect(option.series[0].data.map((bar) => bar.value)).toEqual([8.3, 75]);
  });

  it('descreve positivos e casos com resultado no tooltip', () => {
    const tooltip = samplePositivityTooltip(data.types[1]);
    expect(tooltip).toContain('Positividade: <b>75,0%</b>');
    expect(tooltip).toContain('15 positivos em 20 casos com resultado');
  });
});

describe('buildAntiviralWindowsOption', () => {
  const window = (key: string, label: string, cure: number, death: number) => ({
    key,
    label,
    total: cure + death,
    cure,
    death,
    cure_pct: cure + death ? (cure / (cure + death)) * 100 : null,
    death_pct: cure + death ? (death / (cure + death)) * 100 : null,
  });
  const data: AntiviralWindowsResponse = {
    treated: 12,
    with_dates: 12,
    median_days: 2,
    within_2d_pct: 50,
    cure_within_2d_pct: 87.5,
    cure_without_antiviral_pct: 70,
    death_after_5d_pct: 50,
    windows: [
      window('le1', 'Até 1 dia', 4, 0),
      window('d2', '2 dias', 3, 1),
      window('d3_5', '3 a 5 dias', 0, 0),
      window('none', 'Sem antiviral', 7, 3),
    ],
  };
  type Option = { xAxis: { data: string[] }; series: { name: string; data: number[] }[] };

  it('descarta janelas sem casos e empilha cura e óbito somando 100%', () => {
    const option = buildAntiviralWindowsOption(data, theme) as Option;
    expect(option.xAxis.data).toEqual([
      'Até 1 dia\n(n=4)',
      '2 dias\n(n=4)',
      'Sem antiviral\n(n=10)',
    ]);
    expect(option.series.map((serie) => serie.name)).toEqual(['Cura', 'Óbito']);
    expect(option.series[0].data).toEqual([100, 75, 70]);
    expect(option.series[1].data).toEqual([0, 25, 30]);
  });

  it('descreve a janela no tooltip', () => {
    const tooltip = antiviralWindowTooltip(data.windows[1]);
    expect(tooltip).toContain('2 dias</b>: 4 casos com desfecho');
    expect(tooltip).toContain('Cura: <b>3</b> (75,0%)');
  });
});

describe('buildImagingOption', () => {
  const finding = (name: string, deathPct: number | null, icuPct: number): ImagingFinding => ({
    finding: name,
    total: 20,
    icu_pct: icuPct,
    resolved: 18,
    deaths: 4,
    death_pct: deathPct,
  });
  const rows = [finding('A', 50, 80), finding('B', 10, 20), finding('C', null, 40)];
  type Option = {
    yAxis: { data: string[] };
    series: { name: string; data: { value: number }[] }[];
  };

  it('ordena do menos letal ao mais letal, deixando o mais letal no topo', () => {
    const option = buildImagingOption(rows, theme) as Option;
    expect(option.yAxis.data).toEqual(['C (n=20)', 'B (n=20)', 'A (n=20)']);
  });

  it('cria uma série de UTI e uma de letalidade, tratando letalidade ausente como 0', () => {
    const option = buildImagingOption(rows, theme) as Option;
    expect(option.series.map((serie) => serie.name)).toEqual(['Foram para a UTI', 'Morreram']);
    expect(option.series[0].data.map((bar) => bar.value)).toEqual([40, 20, 80]);
    expect(option.series[1].data.map((bar) => bar.value)).toEqual([0, 10, 50]);
  });

  it('descreve UTI e letalidade no tooltip', () => {
    const tooltip = imagingTooltip(rows[0]);
    expect(tooltip).toContain('Foram para a UTI: <b>80,0%</b>');
    expect(tooltip).toContain('4 óbitos em 18 casos com desfecho');
    expect(imagingTooltip(rows[2])).toContain('Letalidade: <b>—</b>');
  });
});

describe('buildNotificationDelayOption', () => {
  const bairro = (
    name: string,
    median: number,
    status: NotificationDelayBairro['status'],
  ): NotificationDelayBairro => ({
    bairro: name,
    total: 12,
    median_days: median,
    mean_days: median + 0.4,
    within_limit_pct: 40,
    status,
  });
  const rows = [
    bairro('CENTRO', 13, 'critico'),
    bairro('ALTO', 8.5, 'atencao'),
    bairro('SUL', 3, 'adequado'),
  ];
  type Option = {
    xAxis: { max: number };
    yAxis: { inverse: boolean; data: string[] };
    series: {
      data: { value: number; itemStyle: { color: string } }[];
      markLine: { data: { xAxis: number }[]; label: { formatter: string } };
    }[];
  };

  it('mantém a ordem recebida e deixa o maior atraso no topo', () => {
    const option = buildNotificationDelayOption(rows, 7, theme) as Option;
    expect(option.yAxis.data).toEqual(['CENTRO', 'ALTO', 'SUL']);
    expect(option.yAxis.inverse).toBe(true);
  });

  it('pinta cada barra pelo status do bairro', () => {
    const option = buildNotificationDelayOption(rows, 7, theme) as Option;
    expect(option.series[0].data.map((bar) => bar.itemStyle.color)).toEqual([
      '#DC2626',
      '#F59E0B',
      '#10B981',
    ]);
  });

  it('marca o limite aceitável com uma linha tracejada', () => {
    const option = buildNotificationDelayOption(rows, 7, theme) as Option;
    const [line] = option.series[0].markLine.data;
    expect(line.xAxis).toBe(7);
    expect(option.series[0].markLine.label.formatter).toBe('Limite aceitável: 7 dias');
  });

  it('deixa folga no eixo para o maior atraso e para o limite', () => {
    expect((buildNotificationDelayOption(rows, 7, theme) as Option).xAxis.max).toBe(16);
    expect(
      (buildNotificationDelayOption([bairro('X', 1, 'adequado')], 7, theme) as Option).xAxis.max,
    ).toBe(10);
  });

  it('não quebra sem nenhum bairro', () => {
    const option = buildNotificationDelayOption([], 7, theme) as Option;
    expect(option.yAxis.data).toEqual([]);
    expect(option.xAxis.max).toBe(10);
  });

  it('descreve mediana, média e % no prazo no tooltip', () => {
    const tooltip = notificationDelayTooltip(rows[1], 7);
    expect(tooltip).toContain('<b>ALTO</b>: 12 casos');
    expect(tooltip).toContain('Mediana: <b>8,5 dias</b> (média 8,9)');
    expect(tooltip).toContain('Notificados em até 7 dias: <b>40,0%</b>');
  });
});

describe('buildMaternalOutcomesOption', () => {
  const group = (name: string, cure: number, icu: number, death: number, other = 0) => ({
    group: name,
    total: cure + icu + death + other,
    cure,
    icu,
    death,
    other,
  });
  const data: MaternalOutcomesResponse = {
    gestantes_total: 14,
    puerperas_total: 2,
    min_cases: 10,
    groups: [
      group('Gest. 1º tri', 8, 1, 1),
      group('Gest. 3º tri', 3, 0, 1),
      group('Puérpera', 1, 1, 0),
    ],
  };
  type Option = { xAxis: { data: string[] }; series: { name: string; data: number[] }[] };

  it('empilha os quatro desfechos somando 100% e marca grupos pequenos com *', () => {
    const option = buildMaternalOutcomesOption(data, theme) as Option;
    expect(option.xAxis.data).toEqual([
      'Gest. 1º tri\n(n=10)',
      'Gest. 3º tri *\n(n=4)',
      'Puérpera *\n(n=2)',
    ]);
    expect(option.series.map((serie) => serie.name)).toEqual([
      'Cura sem UTI',
      'UTI e sobreviveu',
      'Óbito',
      'Outro ou em aberto',
    ]);
    expect(option.series[0].data).toEqual([80, 75, 50]);
    expect(option.series[2].data).toEqual([10, 25, 0]);
  });

  it('avisa no tooltip quando o grupo tem poucos casos', () => {
    expect(maternalTooltip(data.groups[1], 10)).toContain('Poucos casos');
    expect(maternalTooltip(data.groups[0], 10)).not.toContain('Poucos casos');
    expect(maternalTooltip(data.groups[0], 10)).toContain('Cura sem UTI: <b>8</b> (80,0%)');
  });
});

describe('buildRankedBarsOption', () => {
  const items = [
    { label: 'B', count: 5 },
    { label: 'A', count: 20 },
    { label: 'C', count: 0 },
  ];
  type Option = {
    yAxis: { data: string[]; inverse: boolean };
    series: { data: { value: number }[] }[];
  };

  it('ordena do maior ao menor deixando o maior no topo', () => {
    const option = buildRankedBarsOption(items, theme, { base: 25 }) as Option;
    expect(option.yAxis.data).toEqual(['A', 'B', 'C']);
    expect(option.yAxis.inverse).toBe(true);
    expect(option.series[0].data.map((d) => d.value)).toEqual([20, 5, 0]);
  });

  it('mantém a ordem recebida quando são etapas', () => {
    const option = buildRankedBarsOption(items, theme, { base: 25, order: 'keep' }) as Option;
    expect(option.yAxis.data).toEqual(['B', 'A', 'C']);
  });

  it('não altera a lista original', () => {
    rankedBarsRows(items, 'desc');
    expect(items.map((item) => item.label)).toEqual(['B', 'A', 'C']);
  });

  it('calcula o percentual sobre a base informada', () => {
    expect(rankedBarTooltip(items[1], 25)).toContain('20 casos (80,0%)');
    expect(rankedBarTooltip(items[1], 0)).toContain('(0,0%)');
  });
});

describe('atraso por unidade', () => {
  const unit = (name: string, median: number, status: 'adequado' | 'atencao' | 'critico') => ({
    id_unidade: '1',
    unit: name,
    total: 10,
    median_days: median,
    mean_days: median + 1,
    within_limit_pct: 40,
    status,
  });
  const units = [unit('HOSPITAL A', 12, 'critico'), unit('UPA B', 3, 'adequado')];

  it('troca o nome da unidade pelo campo que o gráfico de bairros espera', () => {
    const rows = unitDelayAsRows(units);
    expect(rows[0].bairro).toBe('HOSPITAL A');
    expect(rows[0]).not.toHaveProperty('unit');
    expect(rows[0]).not.toHaveProperty('id_unidade');
    expect(rows[0].median_days).toBe(12);
  });

  it('desenha uma barra por unidade, com a cor do status e o limite de 7 dias', () => {
    type Option = {
      grid: { left: number };
      yAxis: { data: string[]; inverse: boolean };
      series: {
        data: { value: number; itemStyle: { color: string } }[];
        markLine: { data: { xAxis: number }[] };
      }[];
    };
    const option = buildUnitDelayOption(units, 7, theme) as Option;
    expect(option.yAxis.data).toEqual(['HOSPITAL A', 'UPA B']);
    expect(option.yAxis.inverse).toBe(true);
    expect(option.grid.left).toBeGreaterThan(190);
    expect(option.series[0].data.map((point) => point.value)).toEqual([12, 3]);
    expect(option.series[0].data[0].itemStyle.color).not.toBe(
      option.series[0].data[1].itemStyle.color,
    );
    expect(option.series[0].markLine.data).toEqual([{ xAxis: 7 }]);
  });
});

describe('buildStayCurveOption', () => {
  const curve = [
    { day: 0, cure_pct: 0, death_pct: 0 },
    { day: 1, cure_pct: 20, death_pct: 5 },
    { day: 2, cure_pct: 55.5, death_pct: 10 },
  ];
  type Option = {
    xAxis: { data: number[] };
    yAxis: { max: number };
    series: { name: string; data: number[] }[];
  };

  it('desenha duas linhas, alta e óbito, de 0 a 100%', () => {
    const option = buildStayCurveOption(curve, theme) as Option;
    expect(option.xAxis.data).toEqual([0, 1, 2]);
    expect(option.yAxis.max).toBe(100);
    expect(option.series.map((serie) => serie.name)).toEqual(['Já tiveram alta', 'Morreram']);
    expect(option.series[0].data).toEqual([0, 20, 55.5]);
    expect(option.series[1].data).toEqual([0, 5, 10]);
  });

  it('descreve o dia no tooltip', () => {
    const tooltip = stayCurveTooltip(curve[2]);
    expect(tooltip).toContain('Até o 2º dia de internação');
    expect(tooltip).toContain('Já tiveram alta: <b>55,5%</b>');
    expect(tooltip).toContain('Morreram: <b>10,0%</b>');
  });
});
