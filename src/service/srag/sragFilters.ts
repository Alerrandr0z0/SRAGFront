/**
 * Filtros conceituais SRAG (SIVEP-Gripe).
 * Espelha CommonFilters do FastAPI: profile, race, gender, zonas,
 * bairros, unidades, years, agents, months, days, classi.
 * O Front trabalha com o subconjunto: ano + agente + bairro + classificação final.
 */

export interface SragFilters {
  year?: string;
  agent?: string;
  bairro?: string;
  classi?: string;
}

export function buildSragQueryParams({ year, agent, bairro, classi }: SragFilters): string {
  const params = new URLSearchParams();

  if (year) params.append('years', year);
  if (agent) params.append('agents', agent);
  if (bairro) params.append('bairros', bairro);
  if (classi) params.append('classi', classi);

  return params.toString();
}
