import {
  getSragCitizen,
  getSragComorbidities,
  getSragLaboratory,
  getSragSummary,
  getSragTerritory,
  getSragTrends,
  getSragVaccination,
  getSragVirus,
} from './sragClient';
import type { SragFilters } from './sragFilters';
import {
  type ComorbiditiesPareto,
  mapComorbiditiesToPareto,
  mapMaternalToCount,
  mapPopulationPyramid,
  mapPyramidToSexoSeries,
  mapTerritoryToNeighborhood,
  mapTrendsToLine,
  mapVaccinationToCounts,
  mapVirusToDonut,
  type PopulationPyramidSeries,
} from './sragMappers';

export interface SragCards {
  notificacoes: number;
  obitos: number;
  letalidade: number;
  internacoes: number;
  uti: number;
  vacinadosCovid: number;
  vacinadosGripe: number;
  rtPcrDetectaveis: number;
  gestantes: number;
  bairrosAfetados: number;
}

/** Cards da linha atual (CountCard): HOSPITAL==1, UTI==1, EVOLUCAO==2 via /summary. */
export async function loadSragCards(
  setCards: (c: SragCards) => void,
  filters: SragFilters,
): Promise<void> {
  const [summary, vac, lab, citizen, territory] = await Promise.all([
    getSragSummary(filters),
    getSragVaccination(filters).catch(() => ({ resumo: {} })),
    getSragLaboratory(filters).catch(() => ({ total_cases: 0, positivity_rate: 0 })),
    getSragCitizen(filters).catch(() => null),
    getSragTerritory(filters).catch(() => null),
  ]);

  const vacCounts = mapVaccinationToCounts(vac);
  const total = Number(summary?.notification_total ?? summary?.total ?? 0);
  // laboratory_network.total_cases já é o nº de RT-PCR detectáveis (PCR_RESUL==1);
  // positivity_rate usa testados como denominador, não o total de notificações.
  const rtPcr = Number(lab?.total_cases ?? 0);

  setCards({
    notificacoes: total,
    obitos: Number(summary?.death_count ?? 0),
    letalidade: Number(summary?.death_rate ?? 0),
    internacoes: Number(summary?.hospitalized ?? 0),
    uti: Number(summary?.uti_total ?? 0),
    vacinadosCovid: vacCounts.covid,
    vacinadosGripe: vacCounts.gripe,
    rtPcrDetectaveis: rtPcr,
    gestantes: mapMaternalToCount(citizen?.maternal_profile as Record<string, unknown> | undefined),
    bairrosAfetados: territory?.territory?.bairros?.length ?? 0,
  });
}

export async function loadSragAvailableYears(): Promise<number[]> {
  const summary = await getSragSummary({});
  return summary?.available_years ?? [];
}

export async function mountSragSexo(
  setSeries: (s: number[]) => void,
  filters: SragFilters,
): Promise<void> {
  const citizen = await getSragCitizen(filters);
  setSeries(mapPyramidToSexoSeries(citizen?.citizen_pyramid ?? []));
}

export async function mountSragPopulationPyramid(
  setPyramid: (p: PopulationPyramidSeries) => void,
  filters: SragFilters,
): Promise<void> {
  const citizen = await getSragCitizen(filters);
  setPyramid(mapPopulationPyramid(citizen?.population_pyramid ?? []));
}

export async function mountSragAgente(
  setSeries: (s: number[]) => void,
  setLabels: (l: string[]) => void,
  filters: SragFilters,
): Promise<void> {
  const virus = await getSragVirus(filters);
  const { labels, series } = mapVirusToDonut(virus ?? []);
  setSeries(series);
  setLabels(labels);
}

export async function mountSragComorbidades(
  setPareto: (p: ComorbiditiesPareto) => void,
  filters: SragFilters,
): Promise<void> {
  const items = await getSragComorbidities(filters).catch(async () => {
    // Fallback conceitual: risk_factors do citizen_bootstrap.
    const citizen = await getSragCitizen(filters);
    return (citizen?.risk_factors_full ?? []).map((r) => ({
      name: String(r.name ?? r.label ?? 'Outro'),
      value: Number(r.value ?? r.count ?? 0),
    }));
  });
  setPareto(mapComorbiditiesToPareto(items));
}

export async function mountSragBairros(
  setData: (d: unknown[]) => void,
  filters: SragFilters,
): Promise<unknown[]> {
  const territory = await getSragTerritory(filters);
  const mapped = mapTerritoryToNeighborhood(territory?.territory?.bairros ?? []);
  setData(mapped);
  return mapped;
}

export async function mountSragTrends(
  setSeries: (s: { name: string; data: number[] }[]) => void,
  setCategories: (c: string[]) => void,
  filters: SragFilters,
  setCumulative?: (c: number[]) => void,
): Promise<void> {
  const trends = await getSragTrends(filters);
  const { series, categories } = mapTrendsToLine(trends);
  setSeries(series);
  setCategories(categories);
  setCumulative?.((trends?.history ?? []).map((h) => Number(h.cumulative ?? 0)));
}
