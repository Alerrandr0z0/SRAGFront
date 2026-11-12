import type {
  RiskFactorBucket,
  RiskFactorLoadResponse,
  SeverityCascadeResponse,
  WarningSign,
  WarningSignsResponse,
} from '../../../service/srag/sragAnalytics';

/** Poucos casos com desfecho: o percentual oscila demais (o Back marca como não confiável). */
export const MIN_RELIABLE_RESOLVED = 10;

export type LethalityTone = 'none' | 'low' | 'mid' | 'high';

export const TONE_COLORS: Record<LethalityTone, string> = {
  none: '#94A3B8',
  low: '#10B981',
  mid: '#F59E0B',
  high: '#DC2626',
};

/** Texto do selo de letalidade (claro e escuro). */
export const TONE_TEXT: Record<LethalityTone, string> = {
  none: 'text-body dark:text-bodydark',
  low: 'text-[#047857] dark:text-[#34D399]',
  mid: 'text-[#B45309] dark:text-[#FBBF24]',
  high: 'text-[#B91C1C] dark:text-[#F87171]',
};

export const TONE_LABELS: Record<Exclude<LethalityTone, 'none'>, string> = {
  low: 'abaixo da média geral',
  mid: 'até 2× a média geral',
  high: '2× a média geral ou mais',
};

const oneDecimal = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

export function formatLethality(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : `${oneDecimal(value)}%`;
}

/** Cor da letalidade em relação à letalidade geral: verde abaixo, âmbar até 2×, vermelho acima. */
export function lethalityTone(value: number | null, baseline: number | null): LethalityTone {
  if (value === null) return 'none';
  if (baseline === null || baseline <= 0) return 'mid';
  if (value >= baseline * 2) return 'high';
  if (value >= baseline) return 'mid';
  return 'low';
}

/** Largura da barra (0–100) para `value` numa escala que termina em `max`. */
export function barWidth(value: number | null, max: number): number {
  if (value === null || value <= 0 || max <= 0) return 0;
  return Math.max(2, Math.min(100, (value / max) * 100));
}

/** Posição (0–100) de um marcador, sem o mínimo visual de `barWidth`. */
export function markerPosition(value: number | null, max: number): number | null {
  if (value === null || max <= 0) return null;
  return Math.min(100, (value / max) * 100);
}

export function maxOf(values: (number | null)[]): number {
  return Math.max(0, ...values.map((value) => value ?? 0));
}

/** Quantas vezes a letalidade com o fator é maior que sem ele (null se não der para comparar). */
export function lethalityMultiple(
  withFactor: number | null,
  without: number | null,
): number | null {
  if (withFactor === null || without === null || without <= 0) return null;
  return withFactor / without;
}

export function formatMultiple(multiple: number): string {
  return `×${oneDecimal(multiple)}`;
}

/** Diferença de até 5% é tratada como igual: não vale destacar "mais" ou "menos" letal. */
const SAME_BAND = 0.05;

/** Texto do selo de comparação: "×1,3 mais letal", "×0,6 menos letal" ou "sem diferença". */
export function multipleLabel(multiple: number): { value: string | null; text: string } {
  if (Math.abs(multiple - 1) <= SAME_BAND) return { value: null, text: 'sem diferença' };
  return {
    value: formatMultiple(multiple),
    text: multiple > 1 ? 'mais letal' : 'menos letal',
  };
}

const wholeOrLess = (value: number) =>
  value > 0 && value < 0.5 ? 'menos de 1' : String(Math.round(value));

/** "De cada 100 casos: 70 internam, 34 vão para a UTI e 8 precisam de ventilação invasiva." */
export function cascadeHeadline(data: SeverityCascadeResponse): string | null {
  const byKey = new Map(data.steps.map((step) => [step.key, step]));
  const hospitalized = byKey.get('hospitalized');
  const icu = byKey.get('icu');
  const ventilation = byKey.get('invasive_ventilation');
  if (data.total === 0 || !hospitalized || !icu || !ventilation) return null;
  return `De cada 100 casos: ${wholeOrLess(hospitalized.pct)} internam, ${wholeOrLess(
    icu.pct,
  )} vão para a UTI e ${wholeOrLess(ventilation.pct)} precisam de ventilação invasiva.`;
}

/** O sinal de maior letalidade com amostra confiável (a lista já vem do pior para o melhor). */
export function worstWarningSign(data: WarningSignsResponse): WarningSign | null {
  return data.signs.find((sign) => sign.reliable && sign.lethality !== null) ?? null;
}

export function warningHeadline(data: WarningSignsResponse): string | null {
  const sign = worstWarningSign(data);
  if (!sign || sign.lethality === null) return null;
  const base = `${sign.label}: letalidade de ${formatLethality(sign.lethality)}`;
  if (sign.lethality_without === null || !sign.reliable_without) return `${base}.`;
  return `${base}, contra ${formatLethality(sign.lethality_without)} em quem não tem o sinal.`;
}

function bucketByKey(data: RiskFactorLoadResponse, key: string): RiskFactorBucket | undefined {
  return data.buckets.find((bucket) => bucket.key === key);
}

const RISK_PHRASES: Record<string, string> = {
  '1': '1 fator',
  '2': '2 fatores',
  '3+': '3 ou mais fatores',
};

/** "Quem tem 3 ou mais fatores de risco tem letalidade de 31%, contra 5% de quem não tem nenhum." */
export function riskHeadline(data: RiskFactorLoadResponse): string | null {
  const none = bucketByKey(data, '0');
  if (!none || !none.reliable || none.lethality === null) return null;
  const highest = ['3+', '2', '1']
    .map((key) => bucketByKey(data, key))
    .find((bucket) => bucket?.reliable && bucket.lethality !== null);
  if (!highest) return null;
  return `Quem tem ${RISK_PHRASES[highest.key] ?? highest.label} de risco tem letalidade de ${formatLethality(
    highest.lethality,
  )}, contra ${formatLethality(none.lethality)} de quem não tem nenhum.`;
}
