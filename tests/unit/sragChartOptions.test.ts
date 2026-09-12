import { describe, expect, it } from 'vitest';
import {
  sragDonutAgenteOptions,
  sragDonutProfileOptions,
} from '../../src/service/srag/sragChartOptions';

describe('sragDonutAgenteOptions', () => {
  it('uses fixed colors per agent', () => {
    const options = sragDonutAgenteOptions(['COVID-19', 'Influenza']);
    expect(options.labels).toEqual(['COVID-19', 'Influenza']);
    expect(options.colors).toEqual(['#E03C3C', '#3C50E0']);
  });

  it('falls back for unknown labels', () => {
    const options = sragDonutAgenteOptions(['X']);
    expect(options.labels).toEqual(['X']);
    expect(options.colors).toHaveLength(1);
  });

  it('shows placeholder without data', () => {
    expect(sragDonutAgenteOptions([]).labels).toEqual(['Sem dados']);
  });
});

describe('sragDonutProfileOptions', () => {
  it('passes labels through', () => {
    expect(sragDonutProfileOptions(['Vacinado', 'Ignorado']).labels).toEqual([
      'Vacinado',
      'Ignorado',
    ]);
  });
});
