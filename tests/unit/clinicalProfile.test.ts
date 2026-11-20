import { describe, expect, it } from 'vitest';
import {
  barWidth,
  cascadeHeadline,
  formatLethality,
  formatMultiple,
  lethalityMultiple,
  lethalityTone,
  markerPosition,
  maxOf,
  multipleLabel,
  riskHeadline,
  warningHeadline,
  worstWarningSign,
} from '../../src/pages/Dashboard/analiticos/clinicalProfile';
import type {
  RiskFactorBucket,
  RiskFactorLoadResponse,
  SeverityCascadeResponse,
  SeverityStep,
  WarningSign,
  WarningSignsResponse,
} from '../../src/service/srag/sragAnalytics';

const step = (overrides: Partial<SeverityStep>): SeverityStep => ({
  key: 'notified',
  label: 'Casos notificados',
  pct: 100,
  cases: 100,
  resolved: 80,
  deaths: 8,
  lethality: 10,
  reliable: true,
  ...overrides,
});

const sign = (overrides: Partial<WarningSign>): WarningSign => ({
  key: 'dispneia',
  label: 'Falta de ar (dispneia)',
  cases: 50,
  resolved: 40,
  deaths: 12,
  lethality: 30,
  reliable: true,
  lethality_without: 10,
  reliable_without: true,
  ...overrides,
});

const bucket = (overrides: Partial<RiskFactorBucket>): RiskFactorBucket => ({
  key: '0',
  label: 'Nenhum fator',
  pct: 40,
  cases: 40,
  resolved: 30,
  deaths: 3,
  lethality: 10,
  reliable: true,
  ...overrides,
});

describe('formatLethality / formatMultiple', () => {
  it('usa vírgula decimal e traço quando não há valor', () => {
    expect(formatLethality(12.5)).toBe('12,5%');
    expect(formatLethality(0)).toBe('0%');
    expect(formatLethality(null)).toBe('—');
    expect(formatMultiple(2.34)).toBe('×2,3');
  });
});

describe('lethalityTone', () => {
  it('compara com a letalidade geral', () => {
    expect(lethalityTone(5, 10)).toBe('low');
    expect(lethalityTone(10, 10)).toBe('mid');
    expect(lethalityTone(19.9, 10)).toBe('mid');
    expect(lethalityTone(20, 10)).toBe('high');
  });

  it('sem valor é neutra; sem referência fica em alerta médio', () => {
    expect(lethalityTone(null, 10)).toBe('none');
    expect(lethalityTone(8, null)).toBe('mid');
    expect(lethalityTone(8, 0)).toBe('mid');
  });
});

describe('barWidth / markerPosition / maxOf', () => {
  it('escala a barra e garante um mínimo visível', () => {
    expect(barWidth(50, 100)).toBe(50);
    expect(barWidth(0.1, 100)).toBe(2);
    expect(barWidth(0, 100)).toBe(0);
    expect(barWidth(null, 100)).toBe(0);
    expect(barWidth(150, 100)).toBe(100);
    expect(barWidth(10, 0)).toBe(0);
  });

  it('posiciona o marcador sem mínimo visual', () => {
    expect(markerPosition(25, 100)).toBe(25);
    expect(markerPosition(null, 100)).toBeNull();
    expect(markerPosition(5, 0)).toBeNull();
  });

  it('ignora nulos ao achar o máximo', () => {
    expect(maxOf([3, null, 9])).toBe(9);
    expect(maxOf([])).toBe(0);
  });
});

describe('lethalityMultiple', () => {
  it('divide a letalidade com o fator pela sem o fator', () => {
    expect(lethalityMultiple(30, 10)).toBe(3);
  });

  it('não compara quando falta ou é zero o termo de referência', () => {
    expect(lethalityMultiple(30, 0)).toBeNull();
    expect(lethalityMultiple(null, 10)).toBeNull();
    expect(lethalityMultiple(30, null)).toBeNull();
  });
});

describe('multipleLabel', () => {
  it('diz mais letal acima de 1 e menos letal abaixo', () => {
    expect(multipleLabel(2.34)).toEqual({ value: '×2,3', text: 'mais letal' });
    expect(multipleLabel(0.6)).toEqual({ value: '×0,6', text: 'menos letal' });
  });

  it('trata diferença de até 5% como sem diferença', () => {
    expect(multipleLabel(1.04)).toEqual({ value: null, text: 'sem diferença' });
    expect(multipleLabel(0.96)).toEqual({ value: null, text: 'sem diferença' });
  });
});

describe('cascadeHeadline', () => {
  const data = (steps: SeverityStep[], total = 100): SeverityCascadeResponse => ({ total, steps });

  it('resume a cascata em uma frase', () => {
    const headline = cascadeHeadline(
      data([
        step({}),
        step({ key: 'hospitalized', pct: 70.4 }),
        step({ key: 'icu', pct: 33.6 }),
        step({ key: 'invasive_ventilation', pct: 8.2 }),
      ]),
    );
    expect(headline).toBe(
      'De cada 100 casos: 70 internam, 34 vão para a UTI e 8 precisam de ventilação invasiva.',
    );
  });

  it('diz "menos de 1" para proporções muito pequenas', () => {
    const headline = cascadeHeadline(
      data([
        step({ key: 'hospitalized', pct: 50 }),
        step({ key: 'icu', pct: 10 }),
        step({ key: 'invasive_ventilation', pct: 0.3 }),
      ]),
    );
    expect(headline).toContain('menos de 1 precisam de ventilação invasiva');
  });

  it('não gera frase sem casos ou sem etapas', () => {
    expect(cascadeHeadline(data([], 0))).toBeNull();
    expect(cascadeHeadline(data([step({})]))).toBeNull();
  });
});

describe('warningHeadline / worstWarningSign', () => {
  const data = (signs: WarningSign[]): WarningSignsResponse => ({ baseline: 15, signs });

  it('destaca o sinal mais letal com amostra confiável', () => {
    const response = data([
      sign({ key: 'a', label: 'Sinal A', lethality: 60, reliable: false }),
      sign({ key: 'b', label: 'Saturação abaixo de 95%', lethality: 31, lethality_without: 12 }),
    ]);
    expect(worstWarningSign(response)?.key).toBe('b');
    expect(warningHeadline(response)).toBe(
      'Saturação abaixo de 95%: letalidade de 31%, contra 12% em quem não tem o sinal.',
    );
  });

  it('omite a comparação quando quem não tem o sinal é pouco confiável', () => {
    const response = data([sign({ reliable_without: false })]);
    expect(warningHeadline(response)).toBe('Falta de ar (dispneia): letalidade de 30%.');
  });

  it('não gera frase se nenhum sinal é confiável', () => {
    expect(warningHeadline(data([sign({ reliable: false })]))).toBeNull();
    expect(warningHeadline(data([]))).toBeNull();
  });
});

describe('riskHeadline', () => {
  const data = (buckets: RiskFactorBucket[]): RiskFactorLoadResponse => ({
    baseline: 12,
    factors: ['Diabetes'],
    buckets,
  });

  it('compara a maior carga confiável com quem não tem fator', () => {
    const response = data([
      bucket({}),
      bucket({ key: '1', label: '1 fator', lethality: 15 }),
      bucket({ key: '2', label: '2 fatores', lethality: 22 }),
      bucket({ key: '3+', label: '3 ou mais', lethality: 31 }),
    ]);
    expect(riskHeadline(response)).toBe(
      'Quem tem 3 ou mais fatores de risco tem letalidade de 31%, contra 10% de quem não tem nenhum.',
    );
  });

  it('desce para o próximo grupo quando o último tem poucos casos', () => {
    const response = data([
      bucket({}),
      bucket({ key: '2', label: '2 fatores', lethality: 22 }),
      bucket({ key: '3+', label: '3 ou mais', lethality: 80, reliable: false }),
    ]);
    expect(riskHeadline(response)).toContain('Quem tem 2 fatores de risco tem letalidade de 22%');
  });

  it('não gera frase sem o grupo de referência confiável', () => {
    expect(riskHeadline(data([bucket({ reliable: false })]))).toBeNull();
    expect(riskHeadline(data([]))).toBeNull();
  });
});
