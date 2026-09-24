/**
 * Filtros conceituais SRAG (SIVEP-Gripe).
 * Espelha CommonFilters do FastAPI: years, agents, bairros, classi, base,
 * gravidade, sintomas.
 * O Front trabalha com o subconjunto: ano + agente + bairro + classificação
 * final (valor único cada) + base de análise + gravidade (valor único cada)
 * + sintomatologia (multi-seleção).
 */

export interface SragFilters {
  year?: string;
  agent?: string;
  bairro?: string;
  classi?: string;
  /** Base de análise: 'notificados' (default) | 'confirmados' | 'obitos'. */
  base?: string;
  /** Gravidade: 'todos' (default) | 'uti' | 'internacao' | 'ventilacao'. */
  gravidade?: string;
  /** Sintomatologia: multi-seleção, regra AND entre as chaves escolhidas. */
  sintomas?: string[];
}

export function buildSragQueryParams({
  year,
  agent,
  bairro,
  classi,
  base,
  gravidade,
  sintomas,
}: SragFilters): string {
  const params = new URLSearchParams();

  if (year) params.append('years', year);
  if (agent) params.append('agents', agent);
  if (bairro) params.append('bairros', bairro);
  if (classi) params.append('classi', classi);
  if (base) params.append('base', base);
  if (gravidade) params.append('gravidade', gravidade);
  for (const sintoma of sintomas ?? []) {
    if (sintoma) params.append('sintomas', sintoma);
  }

  return params.toString();
}
