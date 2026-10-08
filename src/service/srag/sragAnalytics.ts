import { getApiData } from '../api/Api';
import { buildSragQueryParams, type SragFilters } from './sragFilters';

// --- Fluxo da jornada clínica (Sankey) ---

export interface FlowNode {
  name: string;
}

export interface FlowLink {
  source: string;
  target: string;
  value: number;
  pct: number;
}

export interface ClinicalFlowResponse {
  nodes: FlowNode[];
  links: FlowLink[];
}

// --- Odds Ratio de comorbidades ---

export interface OddsRatioRow {
  name: string;
  value: number;
  deaths: number;
  lethality: number;
  prevalence: number;
  odds_ratio: number;
  ci_lower: number;
  ci_upper: number;
}

// --- Assinatura clínica de sintomas ---

export type SignatureProfile = 'all' | 'crianca' | 'adolescente' | 'adulto' | 'idoso';
export type SignatureAgent = 'covid' | 'gripe' | 'vsr';
/** Cada célula: [prevalência %, nº de casos com o sintoma]. */
export type SignatureCell = [number, number];

export interface SymptomsSignatureResponse {
  labels: string[];
  bands: string[];
  matrices: Partial<Record<SignatureAgent, SignatureCell[][]>>;
}

export function buildAnalyticsUrl(
  path: string,
  filters: SragFilters,
  extra: Record<string, string> = {},
): string {
  const params = new URLSearchParams(buildSragQueryParams(filters));
  for (const [key, value] of Object.entries(extra)) params.set(key, value);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function getClinicalFlow(filters: SragFilters): Promise<ClinicalFlowResponse> {
  return getApiData<ClinicalFlowResponse>(buildAnalyticsUrl('/analytics/clinical_flow', filters));
}

export function getOddsRatio(filters: SragFilters): Promise<OddsRatioRow[]> {
  return getApiData<OddsRatioRow[]>(
    buildAnalyticsUrl('/analytics/comorbidities_odds_ratio', filters),
  );
}

export function getSymptomsSignature(
  filters: SragFilters,
  profile: SignatureProfile,
): Promise<SymptomsSignatureResponse> {
  return getApiData<SymptomsSignatureResponse>(
    buildAnalyticsUrl('/analytics/symptoms_signature', filters, { profile }),
  );
}
