import { useMemo } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import {
  buildRankedBarsOption,
  formatPercent,
  percentOf,
} from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import { getCovidImmunization } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import Kpi, { formatCount } from './Kpi';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchImmunization = (filters: SragFilters) => getCovidImmunization(filters);

const BOOSTERS = new Set(['1º reforço', '2º reforço', 'Reforço bivalente']);

export default function CovidImmunizationCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchImmunization, filters);
  const theme = chartTheme(useIsDark());
  const data = slice.data;

  const known = data?.dose_stages.filter((stage) => stage.label !== 'Ignorado') ?? [];
  const knownTotal = known.reduce((sum, stage) => sum + stage.count, 0);
  const unvaccinated = known.find((stage) => stage.label === 'Não vacinado')?.count ?? 0;
  const boosted = known
    .filter((stage) => BOOSTERS.has(stage.label))
    .reduce((sum, s) => sum + s.count, 0);
  const manufacturersTotal = data?.manufacturers.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const topManufacturer = data?.manufacturers[0];

  const stagesOption = useMemo(
    () =>
      known.length > 0
        ? buildRankedBarsOption(known, theme, {
            base: knownTotal,
            color: '#10B981',
            order: 'keep',
            labelWidth: 150,
          })
        : null,
    [known, knownTotal, theme],
  );
  const manufacturersOption = useMemo(
    () =>
      data && data.manufacturers.length > 0
        ? buildRankedBarsOption(data.manufacturers, theme, {
            base: manufacturersTotal,
            color: '#3C50E0',
            labelWidth: 190,
          })
        : null,
    [data, manufacturersTotal, theme],
  );

  return (
    <ChartCard
      title="Vacinação contra COVID-19"
      subtitle="Até que dose cada paciente chegou e qual vacina tomou por último."
      help="A etapa é a mais avançada com data registrada na ficha (1ª dose, esquema completo, reforços). 'Não vacinado' é quem a ficha marca como não vacinado. Casos sem informação de vacina ficam de fora da primeira barra e os percentuais são calculados só sobre os que têm a informação. O fabricante é o da última dose registrada; nomes parecidos foram agrupados (por exemplo, Fiocruz e AstraZeneca)."
      status={toCardStatus(slice, () => knownTotal === 0 && manufacturersTotal === 0)}
      refreshing={isRefreshing(slice)}
    >
      {data && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Kpi
              label="Sem nenhuma dose"
              value={formatPercent(percentOf(unvaccinated, knownTotal))}
              detail={`${formatCount(unvaccinated)} de ${formatCount(knownTotal)} com informação`}
            />
            <Kpi
              label="Com algum reforço"
              value={formatPercent(percentOf(boosted, knownTotal))}
              detail={`${formatCount(boosted)} casos`}
            />
            <Kpi
              label="Vacina mais frequente"
              value={<span className="text-lg">{topManufacturer?.label ?? '—'}</span>}
              detail={
                topManufacturer
                  ? `${formatPercent(percentOf(topManufacturer.count, manufacturersTotal))} dos que informaram o fabricante`
                  : 'nenhum fabricante informado'
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div>
              <h4 className="mb-1 text-sm font-semibold text-black dark:text-white">
                Etapa vacinal
              </h4>
              {stagesOption ? (
                <EChartView
                  option={stagesOption}
                  height={280}
                  ariaLabel="Casos por etapa da vacinação contra COVID-19, em barras horizontais"
                />
              ) : (
                <p className="py-12 text-center text-sm text-body dark:text-bodydark">
                  Sem dados de vacinação.
                </p>
              )}
            </div>
            <div>
              <h4 className="mb-1 text-sm font-semibold text-black dark:text-white">
                Fabricante da última dose
              </h4>
              {manufacturersOption ? (
                <EChartView
                  option={manufacturersOption}
                  height={280}
                  ariaLabel="Casos por fabricante da última dose de COVID-19, em barras horizontais"
                />
              ) : (
                <p className="py-12 text-center text-sm text-body dark:text-bodydark">
                  Nenhum fabricante informado.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </ChartCard>
  );
}
