import { useEffect, useMemo, useState } from 'react';
import ChartCard, { type ChartStatus } from '../../components/Charts/Analytics/ChartCard';
import {
  buildHeatmapOption,
  buildOddsRatioOption,
  buildSankeyOption,
  prepareOddsRatio,
} from '../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../components/Charts/Analytics/chartTheme';
import EChartView from '../../components/Charts/Analytics/EChartView';
import AgentSelector from '../../components/Forms/SelectGroup/AgentSelector';
import BairroSelector from '../../components/Forms/SelectGroup/BairroSelector';
import BaseAnaliseSelector from '../../components/Forms/SelectGroup/BaseAnaliseSelector';
import ClassiSelector from '../../components/Forms/SelectGroup/ClassiSelector';
import GravidadeSelector from '../../components/Forms/SelectGroup/GravidadeSelector';
import SintomasSelector from '../../components/Forms/SelectGroup/SintomasSelector';
import YearSelector from '../../components/Forms/SelectGroup/YearSelector';
import useIsDark from '../../hooks/useIsDark';
import DefaultLayout from '../../layout/DefaultLayout';
import { getSragTerritory } from '../../service/srag/sragClient';
import {
  type ClinicalFlowResponse,
  getClinicalFlow,
  getOddsRatio,
  getSymptomsSignature,
  type OddsRatioRow,
  type SignatureAgent,
  type SignatureProfile,
  type SymptomsSignatureResponse,
} from '../../service/srag/sragAnalytics';
import { loadSragAvailableYears } from '../../service/srag/sragDashboard';
import { buildSragQueryParams, type SragFilters } from '../../service/srag/sragFilters';

// --- Carregamento de dados por gráfico -------------------------------------

type LoadStatus = 'loading' | 'ready' | 'error';

interface Slice<T> {
  data: T | null;
  status: LoadStatus;
}

/**
 * Busca os dados de um gráfico sempre que os filtros (ou `extra`) mudam.
 * Cada gráfico tem seu próprio estado: se um endpoint falhar, os outros seguem.
 */
function useAnalyticsData<T>(
  fetcher: (filters: SragFilters, extra: string) => Promise<T>,
  filters: SragFilters,
  extra = '',
): Slice<T> {
  const [slice, setSlice] = useState<Slice<T>>({ data: null, status: 'loading' });
  const key = buildSragQueryParams(filters);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` serializa todos os filtros
  useEffect(() => {
    let cancelled = false;
    setSlice((current) => ({ ...current, status: 'loading' }));
    fetcher(filters, extra)
      .then((data) => !cancelled && setSlice({ data, status: 'ready' }))
      .catch(() => !cancelled && setSlice((current) => ({ ...current, status: 'error' })));
    return () => {
      cancelled = true;
    };
  }, [fetcher, key, extra]);

  return slice;
}

function toCardStatus<T>(slice: Slice<T>, isEmpty: (data: T) => boolean): ChartStatus {
  if (slice.data === null) return slice.status === 'error' ? 'error' : 'loading';
  return isEmpty(slice.data) ? 'empty' : 'ready';
}

const isRefreshing = (slice: Slice<unknown>) => slice.status === 'loading' && slice.data !== null;

const fetchFlow = (filters: SragFilters) => getClinicalFlow(filters);
const fetchOddsRatio = (filters: SragFilters) => getOddsRatio(filters);
const fetchSignature = (filters: SragFilters, profile: string) =>
  getSymptomsSignature(filters, profile as SignatureProfile);

// --- Filtros persistidos (compartilhados com as outras páginas) ------------

function readStoredText(key: string): string {
  return localStorage.getItem(key) || '';
}

function readStoredList(key: string): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

// --- Cards ------------------------------------------------------------------

function FlowCard({ slice }: { slice: Slice<ClinicalFlowResponse> }) {
  const theme = chartTheme(useIsDark());
  const option = useMemo(
    () => (slice.data ? buildSankeyOption(slice.data, theme) : null),
    [slice.data, theme],
  );

  return (
    <ChartCard
      title="Fluxo da jornada clínica"
      subtitle="Origem da infecção → internação (UTI ou enfermaria) → suporte ventilatório → desfecho."
      help="Cada faixa mostra quantos casos seguiram aquele caminho. Ao passar o mouse, a porcentagem é calculada sobre o total que saiu da etapa anterior."
      status={toCardStatus(slice, (data) => data.links.length === 0)}
      refreshing={isRefreshing(slice)}
    >
      <EChartView option={option} height={460} ariaLabel="Diagrama Sankey da jornada clínica" />
    </ChartCard>
  );
}

function OddsRatioCard({ slice }: { slice: Slice<OddsRatioRow[]> }) {
  const theme = chartTheme(useIsDark());
  const plot = useMemo(() => (slice.data ? prepareOddsRatio(slice.data) : null), [slice.data]);
  const option = useMemo(() => (plot ? buildOddsRatioOption(plot, theme) : null), [plot, theme]);
  const height = Math.max(240, (plot?.rows.length ?? 0) * 34 + 90);

  return (
    <ChartCard
      title="Associação de comorbidades com o óbito (Odds Ratio)"
      subtitle="Quanto cada fator de risco aumenta a chance de óbito, entre os casos com desfecho conhecido."
      help="OR > 1 indica associação com o óbito; OR < 1, efeito protetor. A barra é o intervalo de confiança de 95%: quando ele cruza a linha tracejada (OR = 1), a diferença não é estatisticamente significativa."
      status={toCardStatus(slice, (data) => prepareOddsRatio(data).rows.length === 0)}
      refreshing={isRefreshing(slice)}
    >
      <EChartView option={option} height={height} ariaLabel="Odds Ratio por fator de risco" />
      <p className="mt-2 flex flex-wrap gap-x-4 text-xs text-body dark:text-bodydark">
        <span>
          <span className="text-[#DC2626]">●</span> Associado ao óbito
        </span>
        <span>
          <span className="text-[#3C50E0]">●</span> Protetor
        </span>
        <span>
          <span className="text-[#94A3B8]">●</span> Sem significância estatística
        </span>
      </p>
      {plot && plot.omitted.length > 0 && (
        <p className="mt-1 text-xs text-body dark:text-bodydark">
          Sem casos suficientes para estimar: {plot.omitted.join(', ')}.
        </p>
      )}
    </ChartCard>
  );
}

const PROFILES: { value: SignatureProfile; label: string }[] = [
  { value: 'all', label: 'Todas as faixas' },
  { value: 'crianca', label: 'Criança' },
  { value: 'adolescente', label: 'Adolescente' },
  { value: 'adulto', label: 'Adulto' },
  { value: 'idoso', label: 'Idoso' },
];

const SIGNATURE_AGENTS: { key: SignatureAgent; title: string }[] = [
  { key: 'covid', title: 'COVID-19' },
  { key: 'gripe', title: 'Influenza' },
  { key: 'vsr', title: 'VSR' },
];

function SignatureCard({
  slice,
  profile,
  onProfileChange,
}: {
  slice: Slice<SymptomsSignatureResponse>;
  profile: SignatureProfile;
  onProfileChange: (profile: SignatureProfile) => void;
}) {
  const theme = chartTheme(useIsDark());
  const data = slice.data;

  return (
    <ChartCard
      title="Assinatura clínica de sintomas"
      subtitle="% de casos com cada sintoma, por agente etiológico e faixa etária."
      help="Cada caso entra em um único agente (o mesmo critério do filtro de agente: VSR por RT-PCR/antígeno tem prioridade sobre a classificação final). Células com '–' não têm casos naquele grupo."
      status={toCardStatus(slice, (current) => current.labels.length === 0)}
      refreshing={isRefreshing(slice)}
      actions={
        <select
          aria-label="Faixa etária"
          value={profile}
          onChange={(event) => onProfileChange(event.target.value as SignatureProfile)}
          className="rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
        >
          {PROFILES.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="text-body dark:text-bodydark"
            >
              {option.label}
            </option>
          ))}
        </select>
      }
    >
      {data && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {SIGNATURE_AGENTS.map(({ key, title }, index) => (
            <div key={key}>
              <h3 className="mb-1 text-center text-sm font-semibold text-black dark:text-white">
                {title}
              </h3>
              <EChartView
                option={buildHeatmapOption(
                  data.labels,
                  data.bands,
                  data.matrices[key] ?? [],
                  theme,
                  index === 0,
                )}
                height={data.labels.length * 28 + 60}
                ariaLabel={`Mapa de calor de sintomas — ${title}`}
              />
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

// --- Página -----------------------------------------------------------------

const GraficosAnaliticos: React.FC = () => {
  const [yearSelected, setYearSelected] = useState<string>(() => readStoredText('yearSelected'));
  const [agentSelected, setAgentSelected] = useState<string>(() => readStoredText('agentSelected'));
  const [classiSelected, setClassiSelected] = useState<string>(() =>
    readStoredText('classiSelected'),
  );
  const [bairroSelected, setBairroSelected] = useState<string>('');
  const [baseSelected, setBaseSelected] = useState<string>(() => readStoredText('baseSelected'));
  const [gravidadeSelected, setGravidadeSelected] = useState<string>(() =>
    readStoredText('gravidadeSelected'),
  );
  const [sintomasSelected, setSintomasSelected] = useState<string[]>(() =>
    readStoredList('sintomasSelected'),
  );
  const [profile, setProfile] = useState<SignatureProfile>('all');
  const [minYear, setMinYear] = useState<number | undefined>(undefined);
  const [bairros, setBairros] = useState<string[]>([]);

  useEffect(() => {
    loadSragAvailableYears()
      .then((years) => years.length > 0 && setMinYear(Math.min(...years)))
      .catch(() => {});
    getSragTerritory({})
      .then((territory) =>
        setBairros(
          (territory?.territory?.bairros ?? [])
            .map((entity) => entity.bairro)
            .filter(Boolean)
            .sort(),
        ),
      )
      .catch(() => {});
  }, []);

  const filters = useMemo<SragFilters>(
    () => ({
      year: yearSelected || undefined,
      agent: agentSelected || undefined,
      bairro: bairroSelected || undefined,
      classi: classiSelected || undefined,
      base: baseSelected || undefined,
      gravidade: gravidadeSelected || undefined,
      sintomas: sintomasSelected.length > 0 ? sintomasSelected : undefined,
    }),
    [
      yearSelected,
      agentSelected,
      bairroSelected,
      classiSelected,
      baseSelected,
      gravidadeSelected,
      sintomasSelected,
    ],
  );

  const flow = useAnalyticsData(fetchFlow, filters);
  const oddsRatio = useAnalyticsData(fetchOddsRatio, filters);
  const signature = useAnalyticsData(fetchSignature, filters, profile);

  return (
    <DefaultLayout>
      <h1 className="sr-only">Gráficos analíticos</h1>
      <div className="flex flex-wrap justify-end gap-x-2 gap-y-2 items-end">
        <BairroSelector
          bairroSelected={bairroSelected}
          setBairroSelected={setBairroSelected}
          bairros={bairros}
        />
        <YearSelector
          yearSelected={yearSelected}
          setYearSelected={setYearSelected}
          minYear={minYear}
        />
        <AgentSelector agentSelected={agentSelected} setAgentSelected={setAgentSelected} />
        <ClassiSelector
          agentSelected={agentSelected}
          classiSelected={classiSelected}
          setClassiSelected={setClassiSelected}
        />
        <BaseAnaliseSelector baseSelected={baseSelected} setBaseSelected={setBaseSelected} />
        <GravidadeSelector
          gravidadeSelected={gravidadeSelected}
          setGravidadeSelected={setGravidadeSelected}
        />
        <SintomasSelector
          sintomasSelected={sintomasSelected}
          setSintomasSelected={setSintomasSelected}
        />
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <FlowCard slice={flow} />
        <OddsRatioCard slice={oddsRatio} />
        <SignatureCard slice={signature} profile={profile} onProfileChange={setProfile} />
      </div>
    </DefaultLayout>
  );
};

export default GraficosAnaliticos;
