import { getApiData } from '../api/Api';
import { buildSragQueryParams, type SragFilters } from './sragFilters';

// --- Perfil clínico: indicadores de leitura rápida ---

/** Uma etapa da cascata de gravidade (notificados → internados → UTI → ventilação invasiva). */
export interface SeverityStep {
  key: string;
  label: string;
  /** % dos casos notificados que chegam a esta etapa. */
  pct: number;
  cases: number;
  /** Casos com desfecho conhecido (cura, óbito ou outro). */
  resolved: number;
  deaths: number;
  /** Óbitos ÷ casos com desfecho conhecido, em %; null sem casos com desfecho. */
  lethality: number | null;
  /** false quando há poucos casos com desfecho para o percentual ser confiável. */
  reliable: boolean;
}

export interface SeverityCascadeResponse {
  total: number;
  steps: SeverityStep[];
}

export interface WarningSign {
  key: string;
  label: string;
  cases: number;
  resolved: number;
  deaths: number;
  /** Letalidade (%) de quem tem o sinal. */
  lethality: number | null;
  reliable: boolean;
  /** Letalidade (%) de quem não tem o sinal. */
  lethality_without: number | null;
  reliable_without: boolean;
}

export interface WarningSignsResponse {
  /** Letalidade geral, para comparação. */
  baseline: number | null;
  signs: WarningSign[];
}

export interface RiskFactorBucket {
  key: string;
  label: string;
  pct: number;
  cases: number;
  resolved: number;
  deaths: number;
  lethality: number | null;
  reliable: boolean;
}

export interface RiskFactorLoadResponse {
  baseline: number | null;
  /** Fatores de risco considerados na contagem. */
  factors: string[];
  buckets: RiskFactorBucket[];
}

// --- Sintomas que diferenciam COVID-19, Influenza e VSR ---

export type SymptomProfile = 'all' | 'crianca' | 'adolescente' | 'adulto' | 'idoso';

export interface DistinctiveSymptom {
  symptom: string;
  pct: number;
  /** Pontos percentuais acima do maior valor entre os outros agentes. */
  gap: number;
}

export interface SymptomAgent {
  key: string;
  label: string;
  cases: number;
  /** Mesma ordem de `symptoms`. */
  count: number[];
  pct: number[];
  distinctive: DistinctiveSymptom | null;
}

export interface SymptomsByAgentResponse {
  symptoms: string[];
  agents: SymptomAgent[];
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

export function getSeverityCascade(filters: SragFilters): Promise<SeverityCascadeResponse> {
  return getApiData<SeverityCascadeResponse>(
    buildAnalyticsUrl('/analytics/severity_cascade', filters),
  );
}

export function getWarningSigns(filters: SragFilters): Promise<WarningSignsResponse> {
  return getApiData<WarningSignsResponse>(buildAnalyticsUrl('/analytics/warning_signs', filters));
}

export function getRiskFactorLoad(filters: SragFilters): Promise<RiskFactorLoadResponse> {
  return getApiData<RiskFactorLoadResponse>(
    buildAnalyticsUrl('/analytics/risk_factor_load', filters),
  );
}

export function getSymptomsByAgent(
  filters: SragFilters,
  profile: SymptomProfile,
): Promise<SymptomsByAgentResponse> {
  return getApiData<SymptomsByAgentResponse>(
    buildAnalyticsUrl('/analytics/symptoms_by_agent', filters, { profile }),
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

// --- Corredor endêmico, perfil de quem morre e antiviral por faixa etária ---

export type EndemicStatus = 'below' | 'expected' | 'elevated' | 'epidemic';

export interface EndemicWeek {
  week: number;
  /** null nas semanas ainda sem dados do ano de referência. */
  cases: number | null;
  p25: number;
  median: number;
  p75: number;
  /** Limite acima do qual a semana é epidêmica. */
  alert: number;
  status: EndemicStatus | null;
}

export interface EndemicChannelResponse {
  enough_history: boolean;
  min_years: number;
  reference_year: number | null;
  history_years: number[];
  current_week: number | null;
  current_cases: number | null;
  current_status: EndemicStatus | null;
  weeks_above: number;
  weeks: EndemicWeek[];
}

export interface OutcomeProfile {
  count: number;
  median_age: number | null;
  unvaccinated_pct: number | null;
  unvaccinated_known: number;
  risk_factor_pct: number | null;
  risk_factor_known: number;
  reliable: boolean;
}

export interface FatalProfileResponse {
  deaths: OutcomeProfile | null;
  survivors: OutcomeProfile | null;
}

export interface AntiviralAgeBand {
  key: string;
  label: string;
  cases: number;
  treated: number;
  median_days: number | null;
  timely_pct: number | null;
  untreated_pct: number | null;
  reliable: boolean;
}

export interface AntiviralDelayByAgeResponse {
  timely_days: number;
  overall: AntiviralAgeBand | null;
  bands: AntiviralAgeBand[];
}

export function getEndemicChannel(filters: SragFilters): Promise<EndemicChannelResponse> {
  return getApiData<EndemicChannelResponse>(
    buildAnalyticsUrl('/analytics/endemic_channel', filters),
  );
}

export function getFatalProfile(filters: SragFilters): Promise<FatalProfileResponse> {
  return getApiData<FatalProfileResponse>(buildAnalyticsUrl('/analytics/fatal_profile', filters));
}

export function getAntiviralDelayByAge(filters: SragFilters): Promise<AntiviralDelayByAgeResponse> {
  return getApiData<AntiviralDelayByAgeResponse>(
    buildAnalyticsUrl('/analytics/antiviral_delay_by_age', filters),
  );
}
