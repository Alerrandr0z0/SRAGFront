import { describe, expect, it } from 'vitest';
import {
  CLASSI_FIN_LABELS,
  mapComorbiditiesToPareto,
  mapMaternalToCount,
  mapPopulationPyramid,
  mapPyramidToSexoSeries,
  mapTerritoryToNeighborhood,
  mapTrendsToLine,
  mapVaccinationToCounts,
  mapVirusToDonut,
  PYRAMID_BANDS,
  SEXO_LABELS,
} from '../../src/service/srag/sragMappers';

describe('labels and bands', () => {
  it('covers all CLASSI_FIN codes', () => {
    expect(Object.keys(CLASSI_FIN_LABELS).map(Number).sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('maps sexo codes', () => {
    expect(SEXO_LABELS['1']).toBe('Masculino');
    expect(SEXO_LABELS['2']).toBe('Feminino');
  });

  it('builds 5-year bands up to 100', () => {
    expect(PYRAMID_BANDS).toHaveLength(20);
    expect(PYRAMID_BANDS[0]).toMatchObject({ label: '0-4', start: 0, end: 4 });
    expect(PYRAMID_BANDS[19]).toMatchObject({ label: '95-100', start: 95, end: 100 });
  });
});

describe('mapPopulationPyramid', () => {
  it('aggregates ages into bands by sex', () => {
    const series = mapPopulationPyramid([
      { age: 3, male: 2, female: 1 },
      { age: 7, male: 4, female: 0 },
    ]);
    expect(series.male.data[0]).toBe(2);
    expect(series.female.data[0]).toBe(1);
    expect(series.male.data[1]).toBe(4);
    expect(series.maleDetail[0][3]).toBe(2);
    expect(series.categories).toHaveLength(20);
  });

  it('returns zeroed series for empty input', () => {
    const series = mapPopulationPyramid([]);
    expect(series.male.data.every((v) => v === 0)).toBe(true);
  });
});

describe('mapPyramidToSexoSeries', () => {
  it('sums male and female', () => {
    expect(
      mapPyramidToSexoSeries([
        { male: 10, female: 5 },
        { male: 3, female: 7 },
      ]),
    ).toEqual([13, 12]);
  });
});

describe('mapVirusToDonut', () => {
  it('keeps backend order', () => {
    expect(mapVirusToDonut([{ virus: 'COVID-19', count: 9 }])).toEqual({
      labels: ['COVID-19'],
      series: [9],
    });
  });
});

describe('mapComorbiditiesToPareto', () => {
  it('remaps backend cumulative', () => {
    expect(
      mapComorbiditiesToPareto([{ name: 'Cardiopatia', value: 10, cumulative: 40 }]),
    ).toEqual({ labels: ['Cardiopatia'], bars: [10], cumulative: [40] });
  });
});

describe('mapTerritoryToNeighborhood', () => {
  it('maps counts without fabrication', () => {
    expect(
      mapTerritoryToNeighborhood([
        { bairro: 'CENTRO', count: 85, curados: 50, obitos: 10, ignorados: 1 },
      ]),
    ).toEqual([
      { nomeBairro: 'CENTRO', casosReportados: 85, curados: 50, obitos: 10, ignorados: 1 },
    ]);
  });
});

describe('mapTrendsToLine', () => {
  it('maps history to categories', () => {
    expect(mapTrendsToLine({ history: [{ epi_week: '2024-01', total: 5 }] })).toEqual({
      series: [{ name: 'Casos', data: [5] }],
      categories: ['2024-01'],
    });
  });
});

describe('mapVaccinationToCounts', () => {
  it('reads resumo only', () => {
    expect(mapVaccinationToCounts({ resumo: { gripe_vacinados: 3, covid_vacinados: 7 } })).toEqual({
      gripe: 3,
      covid: 7,
    });
    expect(mapVaccinationToCounts({})).toEqual({ gripe: 0, covid: 0 });
  });
});

describe('mapMaternalToCount', () => {
  it('reads gestantes_total', () => {
    expect(mapMaternalToCount({ gestantes_total: 12 })).toBe(12);
    expect(mapMaternalToCount({})).toBe(0);
    expect(mapMaternalToCount(undefined)).toBe(0);
  });
});
