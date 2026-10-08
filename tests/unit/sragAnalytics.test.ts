import { describe, expect, it } from 'vitest';
import { buildAnalyticsUrl } from '../../src/service/srag/sragAnalytics';

describe('buildAnalyticsUrl', () => {
  it('não acrescenta "?" sem filtros', () => {
    expect(buildAnalyticsUrl('/analytics/clinical_flow', {})).toBe('/analytics/clinical_flow');
  });

  it('reaproveita os parâmetros dos filtros do dashboard', () => {
    expect(
      buildAnalyticsUrl('/analytics/clinical_flow', {
        year: '2024',
        base: 'obitos',
        sintomas: ['febre', 'tosse'],
      }),
    ).toBe('/analytics/clinical_flow?years=2024&base=obitos&sintomas=febre&sintomas=tosse');
  });

  it('acrescenta parâmetros extras, como o perfil etário', () => {
    expect(
      buildAnalyticsUrl(
        '/analytics/symptoms_signature',
        { agent: 'COVID-19' },
        { profile: 'idoso' },
      ),
    ).toBe('/analytics/symptoms_signature?agents=COVID-19&profile=idoso');
  });
});
