import api from '../api/Api';
import getApiData from '../api/fetchApiData';
import { buildSragQueryParams, type SragFilters } from './sragFilters';

function qs(filters: SragFilters): string {
  const q = buildSragQueryParams(filters);
  return q ? `?${q}` : '';
}

// --- Tipos mínimos (12 tópicos, sem expandir) ---

export interface SragSummary {
  uti_rate: number;
  uti_total: number;
  death_rate: number;
  death_count: number;
  total: number;
  hospitalized: number;
  notification_total: number;
  available_years: number[];
}

export interface TrendsPoint {
  epi_week: string;
  total: number;
  cumulative?: number;
}

export interface TrendsResponse {
  history: TrendsPoint[];
  forecast: TrendsPoint[];
  base_cumulative: number;
}

export interface VirusItem {
  virus: string;
  count: number;
}

export interface CitizenPyramidBin {
  age_band: string;
  male: number;
  female: number;
}

export interface PopulationPyramidBin {
  age: number;
  male: number;
  female: number;
}

export interface MaternalProfile {
  gestantes?: number;
  gestantes_pct?: number;
  [key: string]: unknown;
}

export interface CitizenBootstrap {
  citizen_pyramid: CitizenPyramidBin[];
  population_pyramid: PopulationPyramidBin[];
  race_profile: Array<{ label: string; count: number }>;
  schooling_profile: Array<{ label: string; count: number }>;
  occupation_profile: Array<{ label: string; count: number }>;
  covid_vaccination_profile?: Array<{ label: string; count: number }>;
  age_pareto?: Array<{ label: string; count: number; cumulative?: number }>;
  risk_factors_full: Array<{ name?: string; label?: string; value?: number; count?: number }>;
  maternal_profile: MaternalProfile | Record<string, unknown>;
}

export interface VaccinationProfile {
  gripe: Record<string, number>;
  covid_detailed: Record<string, number>;
  gripe_donut?: Array<{ label: string; count: number }>;
  resumo?: {
    total?: number;
    gripe_vacinados?: number;
    covid_vacinados?: number;
  };
}

export interface TerritoryEntity {
  bairro: string;
  count: number;
  curados: number;
  obitos: number;
  ignorados: number;
}

export interface NeighborhoodInfo {
  nomeBairro: string;
  casosReportados: number;
  curados: number;
  obitos: number;
  ignorados: number;
}

export interface TerritoryBootstrap {
  territory_entities: {
    urban_bairros: Array<{ label: string; count: number }>;
    rural_comunidades: Array<{ label: string; count: number }>;
  };
  territory?: {
    bairros?: TerritoryEntity[];
    zonas?: Array<{ zona: string; count: number }>;
  };
}

export interface ComorbidityItem {
  name: string;
  value: number;
  cumulative?: number;
  deaths?: number;
  lethality?: number;
}

export interface LaboratoryNetwork {
  total_cases: number;
  positivity_rate: number;
}

export interface IngestStatus {
  total: number;
  available_years: number[];
  latest_notific: string | null;
  raw_files: string[];
  db_mtime: string | null;
}

export interface IngestResult {
  message: string;
  file: string;
  status?: string;
  stats?: {
    temp_cases: number;
    unique_cases: number;
    duplicates_removed: number;
    sources: number;
    quarantined?: number;
  };
}

export interface IngestJob {
  state: 'idle' | 'processing' | 'done' | 'error';
  file?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  stats?: IngestResult['stats'] | null;
  error?: string | null;
}

// --- Quarentena de erros (ADMIN, somente leitura na UI) ---

export interface QuarantineItem {
  id: number;
  batch: string | null;
  source_file: string | null;
  row_index: number | null;
  raw_record: Record<string, unknown>;
  error_category: string | null;
  error_detail: string | null;
  created_at: string | null;
  semana_epidemiologica?: number | null;
  agente?: string | null;
}

export interface ErrorsResponse {
  items: QuarantineItem[];
  total: number;
  page: number;
  page_size: number;
  batch: string | null;
  categories: Array<{ category: string; count: number }>;
  batches: string[];
}

export async function getManageErrors(params: {
  page?: number;
  page_size?: number;
  category?: string;
  batch?: string;
  start_date?: string;
  end_date?: string;
  agent?: string;
}): Promise<ErrorsResponse> {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.page_size) sp.set('page_size', String(params.page_size));
  if (params.category) sp.set('category', params.category);
  if (params.batch) sp.set('batch', params.batch);
  if (params.start_date) sp.set('start_date', params.start_date);
  if (params.end_date) sp.set('end_date', params.end_date);
  if (params.agent) sp.set('agent', params.agent);
  const query = sp.toString();
  return getApiData(`/manage/errors${query ? `?${query}` : ''}`);
}

export interface ReportWeeks {
  year: number;
  min_week: number;
  max_week: number;
}

export async function getReportWeeks(year: string): Promise<ReportWeeks> {
  return getApiData(`/reports/semanas?years=${encodeURIComponent(year)}`);
}

export async function downloadBairrosPdf(queryString: string): Promise<void> {
  const response = await api.get(`/reports/bairros/pdf${queryString ? `?${queryString}` : ''}`, {
    responseType: 'blob',
  });
  const disposition: string = response.headers?.['content-disposition'] ?? '';
  const match = disposition.match(/filename=([^;]+)/);
  const filename = (match?.[1] ?? 'relatorio-bairros.pdf').replace(/["']/g, '');
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadErrorsPdf(params: {
  category?: string;
  batch?: string;
  start_date?: string;
  end_date?: string;
  agent?: string;
}): Promise<void> {
  const sp = new URLSearchParams();
  if (params.category) sp.set('category', params.category);
  if (params.batch) sp.set('batch', params.batch);
  if (params.start_date) sp.set('start_date', params.start_date);
  if (params.end_date) sp.set('end_date', params.end_date);
  if (params.agent) sp.set('agent', params.agent);
  const query = sp.toString();
  const response = await api.get(`/manage/errors/pdf${query ? `?${query}` : ''}`, {
    responseType: 'blob',
  });
  const disposition: string = response.headers?.['content-disposition'] ?? '';
  const match = disposition.match(/filename=([^;]+)/);
  const filename = (match?.[1] ?? 'erros-todos.pdf').replace(/["']/g, '');
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// --- Chamadas (somente GET, Back é read-only) ---

export async function getSragSummary(filters: SragFilters): Promise<SragSummary> {
  return getApiData(`/summary${qs(filters)}`);
}

export async function getSragTrends(filters: SragFilters): Promise<TrendsResponse> {
  // last_n_weeks=0: série anual completa (sem corte das últimas 26 semanas).
  const base = qs(filters);
  const sep = base ? '&' : '?';
  return getApiData(`/trends${base}${sep}last_n_weeks=0`);
}

export async function getSragVirus(filters: SragFilters): Promise<VirusItem[]> {
  return getApiData(`/virus${qs(filters)}`);
}

export async function getSragCitizen(filters: SragFilters): Promise<CitizenBootstrap> {
  return getApiData(`/citizen_bootstrap${qs(filters)}`);
}

export async function getSragVaccination(filters: SragFilters): Promise<VaccinationProfile> {
  return getApiData(`/vaccination_profile${qs(filters)}`);
}

export async function getSragTerritory(
  filters: SragFilters,
  minCases = 1,
): Promise<TerritoryBootstrap> {
  // min_cases=1: a tabela "Casos por bairro" deve somar o total notificado
  // (o default 5 do backend oculta bairros com <5 casos e quebra a conta).
  const base = qs(filters);
  const sep = base ? '&' : '?';
  return getApiData(`/territory_bootstrap${base}${sep}min_cases=${minCases}`);
}

export async function getSragComorbidities(filters: SragFilters): Promise<ComorbidityItem[]> {
  return getApiData(`/clinical/comorbidities_pareto${qs(filters)}`);
}

export async function getSragLaboratory(filters: SragFilters): Promise<LaboratoryNetwork> {
  return getApiData(`/laboratory_network${qs(filters)}`);
}

export async function getSragIngestStatus(): Promise<IngestStatus> {
  return getApiData('/ingest/status');
}

export async function uploadSragSpreadsheet(file: File): Promise<IngestResult> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/ingest/upload', formData);
  const payload = response.data;
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

export async function getSragIngestJob(): Promise<IngestJob> {
  return getApiData('/ingest/job');
}
