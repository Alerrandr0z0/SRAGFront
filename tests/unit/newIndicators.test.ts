import { describe, expect, it } from 'vitest';
import {
  buildEndemicChannelOption,
  endemicTooltip,
} from '../../src/components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../src/components/Charts/Analytics/chartTheme';
import {
  antiviralHeadline,
  bandsWithTreatment,
  endemicHeadline,
  endemicMissingHistory,
  fatalHeadline,
  fatalMetricRows,
  knownCount,
  slowestBand,
} from '../../src/pages/Dashboard/analiticos/newIndicators';
import type {
  AntiviralAgeBand,
  AntiviralDelayByAgeResponse,
  EndemicChannelResponse,
  EndemicWeek,
  FatalProfileResponse,
  OutcomeProfile,
} from '../../src/service/srag/sragAnalytics';

const week = (n: number, overrides: Partial<EndemicWeek> = {}): EndemicWeek => ({
  week: n,
  cases: null,
  p25: 10,
  median: 15,
  p75: 25,
  alert: 47.5,
  status: null,
  ...overrides,
});

const channel = (overrides: Partial<EndemicChannelResponse> = {}): EndemicChannelResponse => ({
  enough_history: true,
  min_years: 3,
  reference_year: 2025,
  history_years: [2022, 2023, 2024],
  current_week: 2,
  current_cases: 60,
  current_status: 'epidemic',
  weeks_above: 1,
  weeks: [week(1, { cases: 12, status: 'expected' }), week(2, { cases: 60, status: 'epidemic' })],
  ...overrides,
});

describe('corredor endêmico', () => {
  it('resume a semana atual contra a faixa', () => {
    expect(endemicHeadline(channel())).toBe(
      'Semana 2 de 2025: 60 casos, em nível epidêmico (esperado: 10 a 25).',
    );
  });

  it('usa o singular com 1 caso', () => {
    const data = channel({
      current_cases: 1,
      current_status: 'below',
      weeks: [week(1), week(2, { cases: 1, status: 'below' })],
    });
    expect(endemicHeadline(data)).toContain('1 caso,');
  });

  it('não gera manchete sem histórico suficiente', () => {
    const data = channel({ enough_history: false, history_years: [2023, 2024], weeks: [] });
    expect(endemicHeadline(data)).toBeNull();
    expect(endemicMissingHistory(data)).toBe(
      'O corredor precisa de pelo menos 3 anos anteriores a 2025; há 2 anos de histórico no recorte atual.',
    );
  });

  it('monta a faixa empilhada e deixa semanas futuras em branco', () => {
    const option = buildEndemicChannelOption(channel(), chartTheme(false)) as {
      series: { name: string; data: (number | null)[] }[];
    };
    const byName = Object.fromEntries(option.series.map((serie) => [serie.name, serie.data]));
    expect(byName.base).toEqual([10, 10]);
    expect(byName['Faixa esperada']).toEqual([15, 15]);
    expect(byName['Zona de alerta']).toEqual([22.5, 22.5]);
    expect(byName['Casos em 2025']).toEqual([12, 60]);
  });

  it('descreve a semana no tooltip', () => {
    const text = endemicTooltip(week(2, { cases: 60, status: 'epidemic' }), 2025);
    expect(text).toContain('Semana epidemiológica 2');
    expect(text).toContain('2025: <b>60</b> casos — em nível epidêmico');
    expect(text).toContain('Alerta acima de 47,5');
  });
});

const profile = (overrides: Partial<OutcomeProfile> = {}): OutcomeProfile => ({
  count: 40,
  median_age: 72,
  unvaccinated_pct: 38.5,
  unvaccinated_known: 30,
  risk_factor_pct: 81,
  risk_factor_known: 35,
  reliable: true,
  ...overrides,
});

describe('perfil de quem morre', () => {
  const data: FatalProfileResponse = {
    deaths: profile(),
    survivors: profile({ count: 200, median_age: 41, unvaccinated_pct: 30, risk_factor_pct: 45 }),
  };

  it('monta as três linhas na ordem idade, vacina e risco', () => {
    const rows = fatalMetricRows(data);
    expect(rows.map((row) => row.key)).toEqual(['age', 'unvaccinated', 'risk']);
    expect(rows[0]?.format(72)).toBe('72 anos');
    expect(rows[1]?.format(38.5)).toBe('38,5%');
    expect(rows[1]?.scale).toBe(100);
    expect(rows[0]?.scale).toBeCloseTo(79.2);
  });

  it('resume quem morre', () => {
    expect(fatalHeadline(data)).toBe(
      'Quem morre tem 72 anos de mediana (sobreviventes: 41), 38,5% sem vacina, 81% com fator de risco.',
    );
  });

  it('não gera manchete sem óbitos', () => {
    expect(fatalHeadline({ deaths: profile({ count: 0 }), survivors: null })).toBeNull();
    expect(fatalHeadline({ deaths: null, survivors: null })).toBeNull();
  });

  it('conta os casos que cada medida cobre', () => {
    expect(knownCount(data.deaths, 'age')).toBe(40);
    expect(knownCount(data.deaths, 'unvaccinated')).toBe(30);
    expect(knownCount(data.deaths, 'risk')).toBe(35);
    expect(knownCount(null, 'risk')).toBe(0);
  });
});

const band = (key: string, overrides: Partial<AntiviralAgeBand> = {}): AntiviralAgeBand => ({
  key,
  label: key,
  cases: 100,
  treated: 50,
  median_days: 2,
  timely_pct: 60,
  untreated_pct: 40,
  reliable: true,
  ...overrides,
});

describe('antiviral por faixa etária', () => {
  const data: AntiviralDelayByAgeResponse = {
    timely_days: 2,
    overall: band('all'),
    bands: [
      band('0-4', { timely_pct: 80 }),
      band('60-79', { timely_pct: 45, median_days: 3 }),
      band('80+', { timely_pct: 10, reliable: false, treated: 4 }),
      band('5-19', { treated: 0, timely_pct: null, median_days: null }),
    ],
  };

  it('ignora faixas pouco confiáveis ao achar a mais lenta', () => {
    expect(slowestBand(data)?.key).toBe('60-79');
  });

  it('não aponta a mais lenta com menos de duas faixas confiáveis', () => {
    expect(slowestBand({ ...data, bands: [band('0-4')] })).toBeNull();
  });

  it('escreve a manchete com a mediana', () => {
    expect(antiviralHeadline(data)).toBe(
      'Em 60-79 só 45% começam o antiviral em até 2 dias (mediana 3 dias).',
    );
  });

  it('lista só as faixas com tratados', () => {
    expect(bandsWithTreatment(data).map((item) => item.key)).toEqual(['0-4', '60-79', '80+']);
  });
});
