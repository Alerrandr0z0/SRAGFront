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

  it('monta a URL do acesso à UTI com o agrupamento escolhido', () => {
    expect(
      buildAnalyticsUrl('/analytics/icu_access', { year: '2025' }, { granularity: 'month' }),
    ).toBe('/analytics/icu_access?years=2025&granularity=month');
  });

  it('monta as URLs dos gráficos de vigilância', () => {
    expect(
      buildAnalyticsUrl(
        '/analytics/nosocomial_risk',
        { base: 'confirmados' },
        { granularity: 'quarter' },
      ),
    ).toBe('/analytics/nosocomial_risk?base=confirmados&granularity=quarter');
    expect(buildAnalyticsUrl('/analytics/diagnostic_lethality', {})).toBe(
      '/analytics/diagnostic_lethality',
    );
  });

  it('monta as URLs dos gráficos de laboratório com os filtros do dashboard', () => {
    expect(buildAnalyticsUrl('/analytics/lab_performance', { year: '2024', agent: 'VSR' })).toBe(
      '/analytics/lab_performance?years=2024&agents=VSR',
    );
    expect(buildAnalyticsUrl('/analytics/imaging_severity', {})).toBe(
      '/analytics/imaging_severity',
    );
  });
});
