import type {
  AntiviralAgeBand,
  AntiviralDelayByAgeResponse,
  EndemicChannelResponse,
  EndemicStatus,
  FatalProfileResponse,
  OutcomeProfile,
} from '../../../service/srag/sragAnalytics';

const oneDecimal = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

export const ENDEMIC_STATUS_LABELS: Record<EndemicStatus, string> = {
  below: 'abaixo do esperado',
  expected: 'dentro do esperado',
  elevated: 'acima do esperado',
  epidemic: 'em nível epidêmico',
};

/** Verde dentro/abaixo da faixa, âmbar acima dela, vermelho acima do limite de alerta. */
export const ENDEMIC_STATUS_COLORS: Record<EndemicStatus, string> = {
  below: '#10B981',
  expected: '#10B981',
  elevated: '#F59E0B',
  epidemic: '#DC2626',
};

/** "Semana 14 de 2025: 42 casos, em nível epidêmico (esperado: 10 a 25)." */
export function endemicHeadline(data: EndemicChannelResponse): string | null {
  const { current_week: week, current_cases: cases, current_status: status } = data;
  if (!data.enough_history || week === null || cases === null || status === null) return null;
  const band = data.weeks[week - 1];
  if (!band) return null;
  const noun = cases === 1 ? 'caso' : 'casos';
  return `Semana ${week} de ${data.reference_year}: ${cases} ${noun}, ${ENDEMIC_STATUS_LABELS[status]} (esperado: ${oneDecimal(band.p25)} a ${oneDecimal(band.p75)}).`;
}

/** Explica por que o corredor não aparece: faltam anos de histórico. */
export function endemicMissingHistory(data: EndemicChannelResponse): string {
  const have = data.history_years.length;
  const noun = have === 1 ? 'ano' : 'anos';
  return `O corredor precisa de pelo menos ${data.min_years} anos anteriores a ${data.reference_year ?? 'o ano de referência'}; há ${have} ${noun} de histórico no recorte atual.`;
}

export type FatalMetricKey = 'age' | 'unvaccinated' | 'risk';

export interface FatalMetricRow {
  key: FatalMetricKey;
  label: string;
  caption: string;
  deaths: number | null;
  survivors: number | null;
  /** Fim da escala das barras: 100 para percentuais, a maior idade para a idade. */
  scale: number;
  format: (value: number | null) => string;
}

const formatPct = (value: number | null) => (value === null ? '—' : `${oneDecimal(value)}%`);
const formatAge = (value: number | null) => (value === null ? '—' : `${oneDecimal(value)} anos`);

/** As três linhas do gráfico "quem morre": idade mediana, % sem vacina e % com fator de risco. */
export function fatalMetricRows(data: FatalProfileResponse): FatalMetricRow[] {
  const { deaths, survivors } = data;
  const ages = [deaths?.median_age ?? 0, survivors?.median_age ?? 0];
  return [
    {
      key: 'age',
      label: 'Idade mediana',
      caption: 'metade tem menos que isso',
      deaths: deaths?.median_age ?? null,
      survivors: survivors?.median_age ?? null,
      scale: Math.max(1, ...ages) * 1.1,
      format: formatAge,
    },
    {
      key: 'unvaccinated',
      label: 'Sem vacina',
      caption: 'nem influenza nem COVID-19',
      deaths: deaths?.unvaccinated_pct ?? null,
      survivors: survivors?.unvaccinated_pct ?? null,
      scale: 100,
      format: formatPct,
    },
    {
      key: 'risk',
      label: 'Com fator de risco',
      caption: 'ao menos um da lista de comorbidades',
      deaths: deaths?.risk_factor_pct ?? null,
      survivors: survivors?.risk_factor_pct ?? null,
      scale: 100,
      format: formatPct,
    },
  ];
}

/** Quantos casos a informação cobre (vacina e risco ignoram o que não foi preenchido). */
export function knownCount(profile: OutcomeProfile | null, key: FatalMetricKey): number {
  if (!profile) return 0;
  if (key === 'age') return profile.count;
  return key === 'unvaccinated' ? profile.unvaccinated_known : profile.risk_factor_known;
}

/** "Quem morre tem 72 anos de mediana (sobreviventes: 41), 38% sem vacina e 81% com fator de risco." */
export function fatalHeadline(data: FatalProfileResponse): string | null {
  const { deaths, survivors } = data;
  if (!deaths || deaths.count === 0) return null;
  const parts: string[] = [];
  if (deaths.median_age !== null) {
    const compare =
      survivors?.median_age != null ? ` (sobreviventes: ${oneDecimal(survivors.median_age)})` : '';
    parts.push(`${oneDecimal(deaths.median_age)} anos de mediana${compare}`);
  }
  if (deaths.unvaccinated_pct !== null)
    parts.push(`${formatPct(deaths.unvaccinated_pct)} sem vacina`);
  if (deaths.risk_factor_pct !== null) {
    parts.push(`${formatPct(deaths.risk_factor_pct)} com fator de risco`);
  }
  return parts.length > 0 ? `Quem morre tem ${parts.join(', ')}.` : null;
}

/** Faixas com pelo menos um tratado, que são as que têm atraso para mostrar. */
export function bandsWithTreatment(data: AntiviralDelayByAgeResponse): AntiviralAgeBand[] {
  return data.bands.filter((band) => band.treated > 0);
}

/** Faixa em que o antiviral menos chega a tempo (só entre as com dados confiáveis). */
export function slowestBand(data: AntiviralDelayByAgeResponse): AntiviralAgeBand | null {
  const reliable = data.bands.filter((band) => band.reliable && band.timely_pct !== null);
  if (reliable.length < 2) return null;
  return reliable.reduce((worst, band) =>
    (band.timely_pct ?? 100) < (worst.timely_pct ?? 100) ? band : worst,
  );
}

/** "Em 80+ anos só 31% começam o antiviral em até 2 dias (mediana 3 dias)." */
export function antiviralHeadline(data: AntiviralDelayByAgeResponse): string | null {
  const band = slowestBand(data);
  if (!band || band.timely_pct === null) return null;
  const median =
    band.median_days === null
      ? ''
      : ` (mediana ${oneDecimal(band.median_days)} ${band.median_days === 1 ? 'dia' : 'dias'})`;
  return `Em ${band.label} só ${oneDecimal(band.timely_pct)}% começam o antiviral em até ${data.timely_days} dias${median}.`;
}
