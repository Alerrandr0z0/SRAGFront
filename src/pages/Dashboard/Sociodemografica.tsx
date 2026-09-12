import type { ApexOptions } from 'apexcharts';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CountCard } from '../../components/Cards/CountCard';
import ColumnGraphic from '../../components/Charts/ColumnGraphic';
import DonutChart from '../../components/Charts/DonutChart';
import ParetoChart from '../../components/Charts/ParetoChart';
import AgentSelector from '../../components/Forms/SelectGroup/AgentSelector';
import BairroSelector from '../../components/Forms/SelectGroup/BairroSelector';
import ClassiSelector from '../../components/Forms/SelectGroup/ClassiSelector';
import YearSelector from '../../components/Forms/SelectGroup/YearSelector';
import BairrosMap from '../../components/Maps/BairrosMap';
import BaseTable from '../../components/Tables/BaseTable';
import DefaultLayout from '../../layout/DefaultLayout';
import {
  sragColumnIdadeOptions,
  sragDonutProfileOptions,
} from '../../service/srag/sragChartOptions';
import {
  getReportWeeks,
  getSragCitizen,
  getSragSummary,
  getSragTerritory,
  getSragVaccination,
  type TerritoryEntity,
} from '../../service/srag/sragClient';
import { mountSragComorbidades } from '../../service/srag/sragDashboard';
import { buildSragQueryParams } from '../../service/srag/sragFilters';
import {
  type ComorbiditiesPareto,
  mapComorbiditiesToPareto,
  mapMaternalToCount,
  mapPopulationPyramid,
  mapTerritoryToNeighborhood,
  type PopulationPyramidSeries,
  PYRAMID_BANDS,
} from '../../service/srag/sragMappers';

interface ProfileItem {
  label: string;
  count: number;
}

function topItem(items: ProfileItem[]): ProfileItem | undefined {
  if (!items.length) return undefined;
  return items.reduce((a, b) => (b.count > a.count ? b : a));
}

function bandTooltip(detail: number[][], seriesName: string) {
  return ({ dataPointIndex }: { dataPointIndex: number }) => {
    const band = PYRAMID_BANDS[dataPointIndex];
    if (!band) return '';
    const counts = detail[dataPointIndex] ?? [];
    const total = counts.reduce((s, c) => s + Number(c ?? 0), 0);
    const rows = counts
      .map(
        (c, k) =>
          `<div style="display:flex;justify-content:space-between;gap:16px"><span>${band.start + k} anos</span><strong>${c}</strong></div>`,
      )
      .join('');
    return `<div style="padding:8px 4px;min-width:150px"><div style="font-weight:700;margin-bottom:4px">${seriesName} · ${band.label} (total ${total})</div>${rows}</div>`;
  };
}

const Sociodemografica: React.FC = () => {
  const [yearSelected, setYearSelected] = useState<string>(() => {
    const stored = localStorage.getItem('yearSelected');
    return stored !== null ? stored : new Date().getFullYear().toString();
  });
  const [agentSelected, setAgentSelected] = useState('');
  const [classiSelected, setClassiSelected] = useState<string>(() => {
    return localStorage.getItem('classiSelected') || '';
  });
  const [bairroSelected, setBairroSelected] = useState('');
  const [bairrosDisponiveis, setBairrosDisponiveis] = useState<string[]>([]);

  const [race, setRace] = useState<ProfileItem[]>([]);
  const [schooling, setSchooling] = useState<ProfileItem[]>([]);
  const [vacCovid, setVacCovid] = useState<ProfileItem[]>([]);
  const [vacGripe, setVacGripe] = useState<ProfileItem[]>([]);
  const [agePareto, setAgePareto] = useState<ComorbiditiesPareto>({
    labels: [],
    bars: [],
    cumulative: [],
  });
  const [zonas, setZonas] = useState<ProfileItem[]>([]);
  const [gestantes, setGestantes] = useState(0);
  const [pareto, setPareto] = useState<ComorbiditiesPareto>({
    labels: [],
    bars: [],
    cumulative: [],
  });
  const [pyramid, setPyramid] = useState<PopulationPyramidSeries>({
    categories: [],
    male: { name: 'Masculino', data: [] },
    female: { name: 'Feminino', data: [] },
    maleDetail: [],
    femaleDetail: [],
  });
  const [mapEntities, setMapEntities] = useState<TerritoryEntity[]>([]);
  const [maxReportWeek, setMaxReportWeek] = useState(52);
  const [loading, setLoading] = useState(true);
  const [minYear, setMinYear] = useState<number | undefined>(undefined);

  const baseOptions = useMemo(() => sragColumnIdadeOptions(), []);

  const maleAgeOptions: ApexOptions = useMemo(
    () => ({
      ...baseOptions,
      colors: ['#3C50E0'],
      xaxis: {
        ...(baseOptions.xaxis ?? {}),
        categories: pyramid.categories,
      },
      yaxis: { title: { text: 'Faixa etária' } },
      tooltip: {
        custom: bandTooltip(pyramid.maleDetail, 'Masculino'),
        fixed: { enabled: true, position: 'topRight', offsetX: -12, offsetY: 12 },
      },
    }),
    [baseOptions, pyramid.categories, pyramid.maleDetail],
  );
  const femaleAgeOptions: ApexOptions = useMemo(
    () => ({
      ...baseOptions,
      colors: ['#E03C3C'],
      xaxis: {
        ...(baseOptions.xaxis ?? {}),
        categories: pyramid.categories,
      },
      yaxis: { title: { text: 'Faixa etária' } },
      tooltip: {
        custom: bandTooltip(pyramid.femaleDetail, 'Feminino'),
        fixed: { enabled: true, position: 'topRight', offsetX: -12, offsetY: 12 },
      },
    }),
    [baseOptions, pyramid.categories, pyramid.femaleDetail],
  );

  const pyramidHeight = Math.min(720, Math.max(420, pyramid.categories.length * 9));

  useEffect(() => {
    getSragSummary({})
      .then((summary) => {
        const years = summary?.available_years ?? [];
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

  const fetchData = useCallback(async () => {
    const filters = {
      year: yearSelected || undefined,
      agent: agentSelected || undefined,
      bairro: bairroSelected || undefined,
      classi: classiSelected || undefined,
    };
    setLoading(true);
    try {
      const [citizen, territory, vac] = await Promise.all([
        getSragCitizen(filters),
        getSragTerritory(filters),
        getSragVaccination(filters).catch(() => null),
        mountSragComorbidades(setPareto, filters),
      ]);
      setRace(citizen?.race_profile ?? []);
      setVacCovid(citizen?.covid_vaccination_profile ?? []);
      setVacGripe(vac?.gripe_donut ?? []);
      setGestantes(
        mapMaternalToCount(citizen?.maternal_profile as Record<string, unknown> | undefined),
      );
      setSchooling(citizen?.schooling_profile ?? []);
      setPyramid(mapPopulationPyramid(citizen?.population_pyramid ?? []));
      setAgePareto(mapComorbiditiesToPareto(citizen?.age_pareto ?? []));
      setZonas((territory?.territory?.zonas ?? []).map((z) => ({ label: z.zona, count: z.count })));
      const bairros = territory?.territory?.bairros ?? [];
      setMapEntities(bairros);
      setBairrosDisponiveis(
        bairros
          .map((e) => e.bairro)
          .filter(Boolean)
          .sort(),
      );
      localStorage.setItem('yearSelected', yearSelected);
      localStorage.setItem('classiSelected', classiSelected);
    } catch {
      setRace([]);
      setVacCovid([]);
      setVacGripe([]);
      setGestantes(0);
      setSchooling([]);
      setPareto({ labels: [], bars: [], cumulative: [] });
      setPyramid({
        categories: [],
        male: { name: 'Masculino', data: [] },
        female: { name: 'Feminino', data: [] },
        maleDetail: [],
        femaleDetail: [],
      });
      setAgePareto({ labels: [], bars: [], cumulative: [] });
      setZonas([]);
      setMapEntities([]);
    } finally {
      setLoading(false);
    }
  }, [yearSelected, agentSelected, bairroSelected, classiSelected]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!yearSelected) return;
    getReportWeeks(yearSelected)
      .then((res) => setMaxReportWeek(res.max_week))
      .catch(() => setMaxReportWeek(52));
  }, [yearSelected]);

  const total = race.reduce((s, r) => s + r.count, 0);

  const neighborhoodData = useMemo(() => mapTerritoryToNeighborhood(mapEntities), [mapEntities]);

  return (
    <DefaultLayout>
      <h1 className="sr-only">Sociodemográfico SRAG</h1>
      <div className="flex flex-wrap justify-end gap-x-2 gap-y-2 items-end">
        <BairroSelector
          bairroSelected={bairroSelected}
          setBairroSelected={setBairroSelected}
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

      {loading ? (
        <p className="py-16 text-center text-gray-400">Carregando…</p>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4 flex-wrap mt-4">
            <CountCard title="Registros com raça informada" count={total} />
            <CountCard title="Gestantes" count={gestantes} />
            <CountCard title="Bairros afetados" count={mapEntities.length} />
          </div>

          <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6">
            <div className="col-span-12">
              <ParetoChart title="Faixa etária" data={agePareto} />
            </div>
            <div className="xl:col-start-1 xl:col-end-7 col-span-12">
              <ColumnGraphic
                title="Casos por idade — Masculino"
                options={maleAgeOptions}
                series={[pyramid.male]}
                horizontal
                height={pyramidHeight}
              />
            </div>
            <div className="xl:col-start-7 xl:col-end-13 col-span-12">
              <ColumnGraphic
                title="Casos por idade — Feminino"
                options={femaleAgeOptions}
                series={[pyramid.female]}
                horizontal
                height={pyramidHeight}
              />
            </div>
            <div className="col-span-12 xl:col-span-3">
              <DonutChart
                chartTitle="Raça/cor"
                options={sragDonutProfileOptions(race.map((r) => r.label))}
                series={race.map((r) => r.count)}
                centerLabel={topItem(race)?.label}
                centerValue={topItem(race)?.count.toLocaleString('pt-BR')}
                customLegend
                height={220}
              />
            </div>
            <div className="col-span-12 xl:col-span-3">
              <DonutChart
                chartTitle="Escolaridade"
                options={sragDonutProfileOptions(schooling.map((r) => r.label))}
                series={schooling.map((r) => r.count)}
                centerLabel={topItem(schooling)?.label}
                centerValue={topItem(schooling)?.count.toLocaleString('pt-BR')}
                customLegend
                height={220}
              />
            </div>
            <div className="col-span-12 xl:col-span-3">
              <DonutChart
                chartTitle="Vacinação COVID-19"
                options={sragDonutProfileOptions(vacCovid.map((r) => r.label))}
                series={vacCovid.map((r) => r.count)}
                centerLabel={topItem(vacCovid)?.label}
                centerValue={topItem(vacCovid)?.count.toLocaleString('pt-BR')}
                customLegend
                height={220}
              />
            </div>
            <div className="col-span-12 xl:col-span-3">
              <DonutChart
                chartTitle="Vacina gripe"
                options={sragDonutProfileOptions(vacGripe.map((r) => r.label))}
                series={vacGripe.map((r) => r.count)}
                centerLabel={topItem(vacGripe)?.label}
                centerValue={topItem(vacGripe)?.count.toLocaleString('pt-BR')}
                customLegend
                height={220}
              />
            </div>
            <div className="xl:col-start-1 xl:col-end-13 col-span-12">
              <ParetoChart title="Comorbidades" data={pareto} />
            </div>
            <div className="col-start-1 col-end-13">
              <BaseTable
                neighborhoodData={neighborhoodData}
                onSelectBairro={setBairroSelected}
                showWeekRange={yearSelected !== ''}
                maxWeek={maxReportWeek}
                reportQuery={buildSragQueryParams({
                  year: yearSelected || undefined,
                  agent: agentSelected || undefined,
                  classi: classiSelected || undefined,
                })}
              />
            </div>
            <BairrosMap entities={mapEntities} zonas={zonas} />
          </div>
        </>
      )}
    </DefaultLayout>
  );
};

export default Sociodemografica;
