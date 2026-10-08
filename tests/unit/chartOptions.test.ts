import { describe, expect, it } from 'vitest';
import {
  buildHeatmapOption,
  buildOddsRatioOption,
  buildSankeyOption,
  heatmapLabel,
  oddsRatioColor,
  prepareOddsRatio,
  sankeyTooltip,
} from '../../src/components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../src/components/Charts/Analytics/chartTheme';
import type { OddsRatioRow } from '../../src/service/srag/sragAnalytics';

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
