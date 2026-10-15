import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AgentSelector from '../../components/Forms/SelectGroup/AgentSelector';
import BairroSelector from '../../components/Forms/SelectGroup/BairroSelector';
import BaseAnaliseSelector from '../../components/Forms/SelectGroup/BaseAnaliseSelector';
import ClassiSelector from '../../components/Forms/SelectGroup/ClassiSelector';
import GravidadeSelector from '../../components/Forms/SelectGroup/GravidadeSelector';
import SintomasSelector from '../../components/Forms/SelectGroup/SintomasSelector';
import YearSelector from '../../components/Forms/SelectGroup/YearSelector';
import DefaultLayout from '../../layout/DefaultLayout';
import { getSragTerritory } from '../../service/srag/sragClient';
import { loadSragAvailableYears } from '../../service/srag/sragDashboard';
import type { SragFilters } from '../../service/srag/sragFilters';
import SectionTabs from './analiticos/SectionTabs';
import { SECTIONS, SectionContent, type SectionId } from './analiticos/sections';

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

  const [searchParams, setSearchParams] = useSearchParams();
  const active: SectionId =
    SECTIONS.find((section) => section.id === searchParams.get('secao'))?.id ?? SECTIONS[0].id;
  const changeSection = (id: SectionId) => setSearchParams({ secao: id }, { replace: true });

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

      <div className="mt-6">
        <SectionTabs sections={SECTIONS} active={active} onChange={changeSection} />
      </div>

      <div
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:gap-7.5"
      >
        <SectionContent id={active} filters={filters} />
      </div>
    </DefaultLayout>
  );
};

export default GraficosAnaliticos;
