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

// --- Acesso à UTI (tempo entre a internação e a entrada na UTI) ---

export type IcuGranularity = 'year' | 'quarter' | 'month';
export type IcuStatus = 'adequado' | 'atencao' | 'critico';

export interface IcuWaitStats {
  total: number;
  same_day: number;
  d1_3: number;
  d4_7: number;
  d8_plus: number;
  /** Mediana da espera entre quem esperou pelo menos 1 dia (null se ninguém esperou). */
  median_wait_days: number | null;
}

export interface IcuAccessPeriod extends IcuWaitStats {
  /** Chave do período: "2024", "2024-Q1" ou "2024-03". */
  period: string;
}

export interface IcuAccessSummary extends IcuWaitStats {
  same_day_pct: number;
  over_limit: number;
  over_limit_pct: number;
  status: IcuStatus | null;
}

export interface IcuAccessResponse {
  granularity: IcuGranularity;
  limit_days: number;
  min_cases: number;
  summary: IcuAccessSummary;
  periods: IcuAccessPeriod[];
}

// --- Confirmação diagnóstica (laboratório x clínico) ---

export interface DiagnosticMethodCounts {
  total: number;
  rt_pcr: number;
  antigeno_outros: number;
  clinico_epi: number;
  clinico_outros: number;
}

export interface DiagnosticMethodsPeriod extends DiagnosticMethodCounts {
  period: string;
}

export interface DiagnosticMethodsResponse {
  granularity: IcuGranularity;
  min_cases: number;
  summary: DiagnosticMethodCounts & { laboratory_pct: number; rt_pcr_pct: number };
  periods: DiagnosticMethodsPeriod[];
}

// --- Infecção hospitalar (nosocomial) ---

export interface OriginLethality {
  resolved: number;
  deaths: number;
  pct: number | null;
}

export interface NosocomialPeriod {
  period: string;
  known: number;
  nosocomial: number;
  pct: number;
  /** Acima do limite de alerta (média + 3 desvios-padrão entre os períodos). */
  alert: boolean;
}

export interface NosocomialRiskResponse {
  granularity: IcuGranularity;
  min_cases: number;
  mean_pct: number | null;
  /** Só existe com 12 ou mais períodos. */
  alert_limit_pct: number | null;
  summary: {
    known: number;
    nosocomial: number;
    nosocomial_pct: number;
    lethality: { nosocomial: OriginLethality; community: OriginLethality };
  };
  periods: NosocomialPeriod[];
}

// --- Letalidade por método de confirmação ---

export interface DiagnosticLethalityMethod {
  method: string;
  cases: number;
  resolved: number;
  deaths: number;
  cfr: number;
  median_days: number | null;
  icu_pct: number;
}

export interface DiagnosticLethalityResponse {
  min_resolved: number;
  overall: { cases: number; resolved: number; deaths: number; cfr: number | null };
  methods: DiagnosticLethalityMethod[];
  hidden: string[];
}

// --- Laboratório: qualidade do diagnóstico ---

export interface LabIndicator {
  count: number;
  pct: number;
  target_pct: number;
}

export interface LabWaitStats {
  count: number;
  mean: number | null;
  median: number | null;
  p90: number | null;
  p95: number | null;
}

export interface LabPerformanceResponse {
  total: number;
  result: LabIndicator;
  collection: LabIndicator;
  rt_pcr_latency: LabWaitStats & { within_target_pct: number | null; target_days: number };
  turnaround: LabWaitStats & { target_days: number };
  positivity: { tested: number; positive: number; pct: number | null };
}

// --- Positividade por tipo de amostra ---

export interface SamplePositivityRow {
  sample_type: string;
  tested: number;
  positive: number;
  positivity_pct: number;
}

export interface SamplePositivityResponse {
  min_tested: number;
  overall: { tested: number; positive: number; pct: number | null };
  types: SamplePositivityRow[];
  hidden: string[];
}

// --- Antiviral: rapidez do tratamento e desfecho ---

export interface AntiviralWindow {
  key: string;
  label: string;
  total: number;
  cure: number;
  death: number;
  cure_pct: number | null;
  death_pct: number | null;
}

export interface AntiviralWindowsResponse {
  treated: number;
  with_dates: number;
  median_days: number | null;
  within_2d_pct: number | null;
  cure_within_2d_pct: number | null;
  cure_without_antiviral_pct: number | null;
  death_after_5d_pct: number | null;
  windows: AntiviralWindow[];
}

// --- Imagem e gravidade ---

export interface ImagingFinding {
  finding: string;
  total: number;
  icu_pct: number;
  resolved: number;
  deaths: number;
  death_pct: number | null;
}

export interface ImagingGroup {
  rows: ImagingFinding[];
  hidden: string[];
}

export interface ImagingSeverityResponse {
  min_cases: number;
  xray: ImagingGroup;
  ct: ImagingGroup;
}

// --- Território: atraso de notificação por bairro ---

export type NotificationDelayStatus = 'adequado' | 'atencao' | 'critico';

export interface NotificationDelayBairro {
  bairro: string;
  total: number;
  median_days: number;
  mean_days: number;
  within_limit_pct: number;
  status: NotificationDelayStatus;
}

export interface NotificationDelayResponse {
  limit_days: number;
  warn_days: number;
  critical_days: number;
  min_cases: number;
  overall: {
    total: number;
    median_days: number | null;
    within_limit_pct: number | null;
    status: NotificationDelayStatus | null;
  };
  /** Da maior para a menor mediana de atraso. */
  bairros: NotificationDelayBairro[];
  /** Bairros com menos casos que o mínimo, fora do ranking. */
  hidden_count: number;
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

// gravidade e letalidade por faixa etária

export interface SeverityByAgePoint {
  age_group: string;
  total_cases: number;
  /** Todos que passaram pela UTI, inclusive os que morreram nela. */
  uti_rate: number;
  support_rate: number;
  /** Óbitos, dentro ou fora da UTI. */
  death_rate: number;
  /** Passaram pela UTI e sobreviveram. */
  icu_survivor_rate: number;
  /** Nem UTI nem óbito. death + icu_survivor + ward = 100%. */
  ward_rate: number;
}

export type SeverityByAgeResponse = SeverityByAgePoint[];

export interface LethalityAgeAgentResponse {
  /** Células com menos casos com desfecho que isto vêm como null. */
  min_resolved: number;
  age_bands: string[];
  agents: string[];
  /** matrix[i][j] = CFR (%) do agente agents[i] na faixa age_bands[j]. */
  matrix: (number | null)[][];
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

export function getIcuAccess(
  filters: SragFilters,
  granularity: IcuGranularity,
): Promise<IcuAccessResponse> {
  return getApiData<IcuAccessResponse>(
    buildAnalyticsUrl('/analytics/icu_access', filters, { granularity }),
  );
}

export function getDiagnosticMethods(
  filters: SragFilters,
  granularity: IcuGranularity,
): Promise<DiagnosticMethodsResponse> {
  return getApiData<DiagnosticMethodsResponse>(
    buildAnalyticsUrl('/analytics/diagnostic_methods', filters, { granularity }),
  );
}

export function getNosocomialRisk(
  filters: SragFilters,
  granularity: IcuGranularity,
): Promise<NosocomialRiskResponse> {
  return getApiData<NosocomialRiskResponse>(
    buildAnalyticsUrl('/analytics/nosocomial_risk', filters, { granularity }),
  );
}

export function getDiagnosticLethality(filters: SragFilters): Promise<DiagnosticLethalityResponse> {
  return getApiData<DiagnosticLethalityResponse>(
    buildAnalyticsUrl('/analytics/diagnostic_lethality', filters),
  );
}

export function getLabPerformance(filters: SragFilters): Promise<LabPerformanceResponse> {
  return getApiData<LabPerformanceResponse>(
    buildAnalyticsUrl('/analytics/lab_performance', filters),
  );
}

export function getSamplePositivity(filters: SragFilters): Promise<SamplePositivityResponse> {
  return getApiData<SamplePositivityResponse>(
    buildAnalyticsUrl('/analytics/sample_positivity', filters),
  );
}

export function getAntiviralWindows(filters: SragFilters): Promise<AntiviralWindowsResponse> {
  return getApiData<AntiviralWindowsResponse>(
    buildAnalyticsUrl('/analytics/antiviral_windows', filters),
  );
}

export function getImagingSeverity(filters: SragFilters): Promise<ImagingSeverityResponse> {
  return getApiData<ImagingSeverityResponse>(
    buildAnalyticsUrl('/analytics/imaging_severity', filters),
  );
}

export function getSeverityByAge(filters: SragFilters): Promise<SeverityByAgeResponse> {
  return getApiData<SeverityByAgeResponse>(
    buildAnalyticsUrl('/analytics/severity_by_age', filters),
  );
}

export function getLethalityByAgeAgent(filters: SragFilters): Promise<LethalityAgeAgentResponse> {
  return getApiData<LethalityAgeAgentResponse>(
    buildAnalyticsUrl('/analytics/lethality_age_agent', filters),
  );
}

export function getNotificationDelay(filters: SragFilters): Promise<NotificationDelayResponse> {
  return getApiData<NotificationDelayResponse>(
    buildAnalyticsUrl('/analytics/notification_delay', filters),
  );
}

// --- Cidadão ---

export interface LabeledCount {
  label: string;
  count: number;
}

export interface MaternalGroup {
  group: string;
  total: number;
  cure: number;
  icu: number;
  death: number;
  other: number;
}

export interface MaternalOutcomesResponse {
  gestantes_total: number;
  puerperas_total: number;
  /** Abaixo disso o percentual do grupo é anedótico. */
  min_cases: number;
  groups: MaternalGroup[];
}

export interface OccupationProfileResponse {
  total: number;
  informed: number;
  items: LabeledCount[];
}

export interface AnimalContactResponse {
  total: number;
  ignored: number;
  items: LabeledCount[];
}

export interface CovidImmunizationResponse {
  manufacturers: LabeledCount[];
  dose_stages: LabeledCount[];
}

export function getMaternalOutcomes(filters: SragFilters): Promise<MaternalOutcomesResponse> {
  return getApiData<MaternalOutcomesResponse>(
    buildAnalyticsUrl('/analytics/maternal_outcomes', filters),
  );
}

export function getOccupationProfile(filters: SragFilters): Promise<OccupationProfileResponse> {
  return getApiData<OccupationProfileResponse>(
    buildAnalyticsUrl('/analytics/occupation_profile', filters),
  );
}

export function getAnimalContact(filters: SragFilters): Promise<AnimalContactResponse> {
  return getApiData<AnimalContactResponse>(buildAnalyticsUrl('/analytics/animal_contact', filters));
}

export function getCovidImmunization(filters: SragFilters): Promise<CovidImmunizationResponse> {
  return getApiData<CovidImmunizationResponse>(
    buildAnalyticsUrl('/analytics/covid_immunization', filters),
  );
}

// --- Unidades de saúde ---

export interface NotifyingUnit {
  id_unidade: string;
  name: string;
  total: number;
  cure: number;
  death: number;
  other: number;
}

export interface NotifyingUnitsResponse {
  total: number;
  /** Casos sem código de unidade notificadora. */
  unidentified: number;
  /** Da unidade que mais notificou para a que menos notificou. */
  items: NotifyingUnit[];
}

export interface UnitDelayRow {
  id_unidade: string;
  unit: string;
  total: number;
  median_days: number;
  mean_days: number;
  within_limit_pct: number;
  status: NotificationDelayStatus;
}

export interface UnitNotificationDelayResponse {
  limit_days: number;
  warn_days: number;
  critical_days: number;
  min_cases: number;
  /** Da maior para a menor mediana de atraso. */
  units: UnitDelayRow[];
  hidden_count: number;
}

export interface StayCurvePoint {
  day: number;
  cure_pct: number;
  death_pct: number;
}

export interface HospitalStayResponse {
  closed: number;
  median_days: number | null;
  median_cure_days: number | null;
  median_death_days: number | null;
  mean_days: number | null;
  bed_days: number;
  daily_census: number | null;
  curve: StayCurvePoint[];
}

export interface VaccineJourneyStage {
  stage: string;
  total: number;
  median_days_to_hospital: number | null;
  median_stay_days: number | null;
  icu_pct: number | null;
  cure_pct: number | null;
  death_pct: number | null;
  resolved: number;
}

export interface VaccineJourneyResponse {
  /** Abaixo disso os números da etapa são anedóticos. */
  min_cases: number;
  stages: VaccineJourneyStage[];
}

export function getNotifyingUnits(filters: SragFilters): Promise<NotifyingUnitsResponse> {
  return getApiData<NotifyingUnitsResponse>(
    buildAnalyticsUrl('/analytics/notifying_units', filters),
  );
}

export function getUnitNotificationDelay(
  filters: SragFilters,
): Promise<UnitNotificationDelayResponse> {
  return getApiData<UnitNotificationDelayResponse>(
    buildAnalyticsUrl('/analytics/unit_notification_delay', filters),
  );
}

export function getHospitalStay(filters: SragFilters): Promise<HospitalStayResponse> {
  return getApiData<HospitalStayResponse>(buildAnalyticsUrl('/analytics/hospital_stay', filters));
}

export function getVaccineJourney(filters: SragFilters): Promise<VaccineJourneyResponse> {
  return getApiData<VaccineJourneyResponse>(
    buildAnalyticsUrl('/analytics/vaccine_journey', filters),
  );
}
