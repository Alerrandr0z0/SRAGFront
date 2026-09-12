/**
 * Mappers conceituais SIVEP -> visual do template.
 * Códigos oficiais (SRAGBack/docs/dicionario.md):
 *  CS_SEXO 1-M/2-F/9-Ign | CLASSI_FIN 1-gripe/2-outro vírus/3-outro agente/
 *  4-não espec/5-covid | EVOLUCAO 1-Cura/2-Óbito (+3 óbito outras, ignorado aqui
 *  por pedido: filtrar código 2) | VACINA/VACINA_COV 1-Sim/2-Não/9-Ign |
 *  HOSPITAL/UTI 1-Sim | PCR_RESUL 1-Detectável.
 */

import type { NeighborhoodInfo } from './sragClient';
import type {
  CitizenPyramidBin,
  PopulationPyramidBin,
  TerritoryEntity,
  TrendsResponse,
  VirusItem,
} from './sragClient';

// --- Labels ---

export const CLASSI_FIN_LABELS: Record<number, string> = {
  1: 'SRAG por influenza',
  2: 'SRAG por outro vírus',
  3: 'SRAG por outro agente',
  4: 'SRAG não especificado',
  5: 'SRAG por covid-19',
};

export const SEXO_LABELS: Record<string, string> = {
  '1': 'Masculino',
  '2': 'Feminino',
  M: 'Masculino',
  F: 'Feminino',
};

// --- Idade em faixas de 5 anos por sexo (2 charts: Masculino / Feminino) ---

export interface PyramidBand {
  label: string;
  start: number;
  end: number;
}

/** Faixas 0-4, 5-9, ..., 90-94, 95-100. */
export const PYRAMID_BANDS: PyramidBand[] = Array.from({ length: 19 }, (_, i) => ({
  label: `${i * 5}-${i * 5 + 4}`,
  start: i * 5,
  end: i * 5 + 4,
})).concat([{ label: '95-100', start: 95, end: 100 }]);

export interface PopulationPyramidSeries {
  categories: string[];
  male: { name: string; data: number[] };
  female: { name: string; data: number[] };
  /** maleDetail[i][k] = casos na k-ésima idade da i-ésima faixa (p/ tooltip). */
  maleDetail: number[][];
  femaleDetail: number[][];
}

const emptyPyramidSeries = (): PopulationPyramidSeries => ({
  categories: PYRAMID_BANDS.map((b) => b.label),
  male: { name: 'Masculino', data: PYRAMID_BANDS.map(() => 0) },
  female: { name: 'Feminino', data: PYRAMID_BANDS.map(() => 0) },
  maleDetail: PYRAMID_BANDS.map((b) => Array(b.end - b.start + 1).fill(0)),
  femaleDetail: PYRAMID_BANDS.map((b) => Array(b.end - b.start + 1).fill(0)),
});

export function mapPopulationPyramid(bins: PopulationPyramidBin[]): PopulationPyramidSeries {
  const series = emptyPyramidSeries();
  if (!bins?.length) return series;
  const byAge = new Map<number, PopulationPyramidBin>();
  for (const bin of bins) byAge.set(Number(bin.age ?? 0), bin);
  PYRAMID_BANDS.forEach((band, i) => {
    let maleTotal = 0;
    let femaleTotal = 0;
    for (let age = band.start; age <= band.end; age += 1) {
      const bin = byAge.get(age);
      const male = Number(bin?.male ?? 0);
      const female = Number(bin?.female ?? 0);
      series.maleDetail[i][age - band.start] = male;
      series.femaleDetail[i][age - band.start] = female;
      maleTotal += male;
      femaleTotal += female;
    }
    series.male.data[i] = maleTotal;
    series.female.data[i] = femaleTotal;
  });
  return series;
}

// --- Sexo (Donut atual: [masculino, feminino]) ---

export function mapPyramidToSexoSeries(pyramid: CitizenPyramidBin[]): number[] {
  let male = 0;
  let female = 0;
  for (const bin of pyramid ?? []) {
    male += Number(bin.male ?? 0);
    female += Number(bin.female ?? 0);
  }
  return [male, female];
}

// --- Agente etiológico / CLASSI_FIN (Donut atual) ---

export function mapVirusToDonut(virus: VirusItem[]): { labels: string[]; series: number[] } {
  const labels = (virus ?? []).map((v) => String(v.virus));
  const series = (virus ?? []).map((v) => Number(v.count ?? 0));
  return { labels, series };
}

// --- Pareto (barras + % acumulado oficiais do backend; front só remapeia) ---

export interface ComorbiditiesPareto {
  labels: string[];
  bars: number[];
  cumulative: number[];
}

export function mapComorbiditiesToPareto(
  items: Array<{
    name?: string;
    label?: string;
    value?: number;
    count?: number;
    cumulative?: number;
  }>,
): ComorbiditiesPareto {
  return {
    labels: (items ?? []).map((i) => String(i.name ?? i.label ?? '')),
    bars: (items ?? []).map((i) => Number(i.value ?? i.count ?? 0)),
    cumulative: (items ?? []).map((i) => Number(i.cumulative ?? 0)),
  };
}

// --- Bairro (BaseTable atual: NeighborhoodInfo) ---

export function mapTerritoryToNeighborhood(entities: TerritoryEntity[]): NeighborhoodInfo[] {
  return (entities ?? []).map((e) => ({
    nomeBairro: e.bairro,
    casosReportados: Number(e.count ?? 0),
    curados: Number(e.curados ?? 0),
    obitos: Number(e.obitos ?? 0),
    ignorados: Number(e.ignorados ?? 0),
  }));
}

// --- Série temporal (Line atual: 1 série + categories) ---

export function mapTrendsToLine(trends: TrendsResponse): {
  series: { name: string; data: number[] }[];
  categories: string[];
} {
  const history = trends?.history ?? [];
  return {
    series: [{ name: 'Casos', data: history.map((h) => Number(h.total ?? 0)) }],
    categories: history.map((h) => String(h.epi_week)),
  };
}

// --- Vacinas (Cards: contagens oficiais do backend, campo `resumo`) ---

export interface VaccinationSummary {
  total?: number;
  gripe_vacinados?: number;
  covid_vacinados?: number;
}

export function mapVaccinationToCounts(vac: { resumo?: VaccinationSummary }): {
  gripe: number;
  covid: number;
} {
  return {
    gripe: Number(vac?.resumo?.gripe_vacinados ?? 0),
    covid: Number(vac?.resumo?.covid_vacinados ?? 0),
  };
}

// --- Gestante (Card: total oficial do backend, campo `gestantes_total`) ---

export function mapMaternalToCount(maternal: Record<string, unknown> | undefined): number {
  const v = maternal?.['gestantes_total'];
  return typeof v === 'number' ? v : 0;
}
