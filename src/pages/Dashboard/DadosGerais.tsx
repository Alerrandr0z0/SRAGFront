import type { ApexOptions } from 'apexcharts';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { CountCard } from '../../components/Cards/CountCard';
import DonutChart from '../../components/Charts/DonutChart';
import TrendChart from '../../components/Charts/TrendChart';
import type { NeighborhoodInfo } from '../../service/srag/sragClient';
import AgentSelector from '../../components/Forms/SelectGroup/AgentSelector';
import BairroSelector from '../../components/Forms/SelectGroup/BairroSelector';
import ClassiSelector from '../../components/Forms/SelectGroup/ClassiSelector';
import YearSelector from '../../components/Forms/SelectGroup/YearSelector';
import DefaultLayout from '../../layout/DefaultLayout';
import {
  sragDonutAgenteOptions,
  sragDonutSexoOptions,
  sragLineOptions,
} from '../../service/srag/sragChartOptions';
import {
  loadSragAvailableYears,
  loadSragCards,
  mountSragAgente,
  mountSragBairros,
  mountSragSexo,
  mountSragTrends,
  type SragCards,
} from '../../service/srag/sragDashboard';

const lineChartBaseOptions: ApexOptions = sragLineOptions();
const donutSexoOptions: ApexOptions = sragDonutSexoOptions();

const EMPTY_CARDS: SragCards = {
  notificacoes: 0,
  obitos: 0,
  letalidade: 0,
  internacoes: 0,
  uti: 0,
  vacinadosCovid: 0,
  vacinadosGripe: 0,
  rtPcrDetectaveis: 0,
  gestantes: 0,
  bairrosAfetados: 0,
};

const DadosGerais: React.FC = () => {
  const [trendSeries, setTrendSeries] = useState<{ name: string; data: number[] }[]>([]);
  const [trendCumulative, setTrendCumulative] = useState<number[]>([]);
  const [trendCategories, setTrendCategories] = useState<string[]>([]);
  const [sexoSeries, setSexoSeries] = useState<number[]>([]);
  const [agenteSeries, setAgenteSeries] = useState<number[]>([]);
  const [agenteLabels, setAgenteLabels] = useState<string[]>([]);
  const [neighborhoodData, setNeighborhoodData] = useState<NeighborhoodInfo[]>([]);
  const [cards, setCards] = useState<SragCards>(EMPTY_CARDS);
  const [minYear, setMinYear] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [yearSelected, setYearSelected] = useState<string>(() => {
    const stored = localStorage.getItem('yearSelected');
    return stored !== null ? stored : new Date().getFullYear().toString();
  });
  const [agentSelected, setAgentSelected] = useState<string>(() => {
    return localStorage.getItem('agentSelected') || '';
  });
  const [classiSelected, setClassiSelected] = useState<string>(() => {
    return localStorage.getItem('classiSelected') || '';
  });
  const [bairroSelected, setBairroSelected] = useState<string>('');

  const bairrosDisponiveis = useMemo(
    () =>
      (neighborhoodData ?? [])
        .map((n) => n.nomeBairro)
        .filter(Boolean)
        .sort(),
    [neighborhoodData],
  );

  const handleBairroChange = (bairro: string) => {
    setBairroSelected(bairro);
  };

  useEffect(() => {
    loadSragAvailableYears()
      .then((years) => {
        if (years.length > 0) {
          setMinYear(Math.min(...years));
          const maxYear = String(Math.max(...years));
          setYearSelected((current) =>
            current === '' || years.includes(Number(current)) ? current : maxYear,
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      const filters = {
        year: yearSelected || undefined,
        agent: agentSelected || undefined,
        bairro: bairroSelected || undefined,
        classi: classiSelected || undefined,
      };
      try {
        const results = await Promise.allSettled([
          mountSragTrends(setTrendSeries, setTrendCategories, filters, setTrendCumulative),
          mountSragSexo(setSexoSeries, filters),
          mountSragAgente(setAgenteSeries, setAgenteLabels, filters),
          mountSragBairros((d) => setNeighborhoodData(d as NeighborhoodInfo[]), filters),
          loadSragCards(setCards, filters),
        ]);
        const failed = results.filter((r) => r.status === 'rejected');
        if (failed.length > 0) {
          console.error('Falhas parciais SRAG:', failed);
        }
        localStorage.setItem('yearSelected', yearSelected);
        localStorage.setItem('agentSelected', agentSelected);
        localStorage.setItem('classiSelected', classiSelected);
      } catch (err) {
        console.error('Erro ao carregar dados SRAG:', err);
        setError('Não foi possível carregar os dados SRAG. Verifique se o backend está no ar.');
      } finally {
        setLoading(false);
        setHasLoaded(true);
      }
    };

    loadData();
  }, [yearSelected, agentSelected, bairroSelected, classiSelected]);

  const trendOptions: ApexOptions = useMemo(
    () => ({
      ...lineChartBaseOptions,
      xaxis: {
        ...(lineChartBaseOptions.xaxis ?? {}),
        categories: trendCategories.length > 0 ? trendCategories : undefined,
        title: { text: 'Casos SRAG por semana epidemiológica', style: { fontSize: '16px' } },
      },
    }),
    [trendCategories],
  );

  // Série acumulada oficial (calculada pelo backend em /trends).
  const cumulativeSeries = useMemo(() => {
    return [{ name: 'Casos acumulados', data: trendCumulative }];
  }, [trendCumulative]);

  const cumulativeOptions: ApexOptions = useMemo(
    () => ({
      ...lineChartBaseOptions,
      xaxis: {
        ...(lineChartBaseOptions.xaxis ?? {}),
        categories: trendCategories.length > 0 ? trendCategories : undefined,
        title: {
          text: 'Contagem de casos por semana epidemiológica acumulado',
          style: { fontSize: '16px' },
        },
      },
    }),
    [trendCategories],
  );

  const agenteOptions: ApexOptions = useMemo(
    () => sragDonutAgenteOptions(agenteLabels),
    [agenteLabels],
  );

  if (loading && !hasLoaded) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            <p className="text-lg text-gray-600 dark:text-gray-400">Carregando dados SRAG...</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <p className="text-xl font-semibold text-red-600">{error}</p>
            <button type="button"
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <h1 className="sr-only">Vigilância</h1>
      <div className="flex flex-wrap justify-end gap-x-2 gap-y-2 items-end">
        <BairroSelector
          bairroSelected={bairroSelected}
          setBairroSelected={handleBairroChange}
          bairros={bairrosDisponiveis}
        />
        <YearSelector
          yearSelected={yearSelected}
          setYearSelected={setYearSelected}
          minYear={minYear}
        />
        <AgentSelector agentSelected={agentSelected} setAgentSelected={setAgentSelected} />
        <ClassiSelector classiSelected={classiSelected} setClassiSelected={setClassiSelected} />
      </div>

      <div
        className={`relative transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}
      >
        {loading && (
          <div className="pointer-events-none absolute right-1 -top-1 z-10 flex items-center gap-2 text-sm font-medium">
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
            Atualizando...
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 flex-wrap">
          <CountCard title="Notificações" count={cards.notificacoes} />
          <CountCard title="Óbitos" count={cards.obitos} />
          <CountCard title="Internações" count={cards.internacoes} />
          <CountCard title="UTI" count={cards.uti} />
        </div>

        <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
          <div className="col-start-1 col-end-13">
            <TrendChart options={trendOptions} series={trendSeries} />
          </div>

          <div className="col-start-1 col-end-13">
            <div className="flex flex-col md:flex-row gap-4 flex-wrap">
              <CountCard title="Vacinados COVID" count={cards.vacinadosCovid} />
              <CountCard title="Vacinados gripe" count={cards.vacinadosGripe} />
              <CountCard title="RT-PCR detectáveis" count={cards.rtPcrDetectaveis} />
            </div>
          </div>

          <div className="xl:col-start-1 xl:col-end-7 col-span-12">
            <DonutChart
              chartTitle="Casos por sexo"
              options={donutSexoOptions}
              series={sexoSeries}
            />
          </div>

          <div className="xl:col-start-7 xl:col-end-13 col-span-12">
            <DonutChart
              chartTitle="Agente etiológico"
              options={agenteOptions}
              series={agenteSeries}
            />
          </div>

          <div className="col-start-1 col-end-13">
            <TrendChart options={cumulativeOptions} series={cumulativeSeries} />
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default DadosGerais;
