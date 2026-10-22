import { useMemo } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import {
  buildMaternalOutcomesOption,
  formatPercent,
  percentOf,
} from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import { getMaternalOutcomes } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import Kpi, { formatCount } from './Kpi';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchMaternal = (filters: SragFilters) => getMaternalOutcomes(filters);

export default function MaternalOutcomesCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchMaternal, filters);
  const theme = chartTheme(useIsDark());
  const data = slice.data;
  const option = useMemo(
    () => (data ? buildMaternalOutcomesOption(data, theme) : null),
    [data, theme],
  );
  const total = data ? data.gestantes_total + data.puerperas_total : 0;
  const deaths = data?.groups.reduce((sum, group) => sum + group.death, 0) ?? 0;

  return (
    <ChartCard
      title="Gestantes e puérperas: como terminou cada caso"
      subtitle="Desfecho por fase da gestação, para saber em que momento o risco pesa mais."
      help="Considera só mulheres notificadas. Quem está no puerpério entra em 'Puérpera' mesmo que também tenha trimestre informado. Os grupos costumam ser muito pequenos: um grupo marcado com * tem poucos casos e o percentual muda muito com um paciente a mais ou a menos. Use como pista, não como taxa."
      status={toCardStatus(slice, (current) => current.groups.length === 0)}
      refreshing={isRefreshing(slice)}
    >
      {data && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Kpi
              label="Gestantes"
              value={formatCount(data.gestantes_total)}
              detail="em qualquer trimestre"
            />
            <Kpi
              label="Puérperas"
              value={formatCount(data.puerperas_total)}
              detail="até 45 dias após o parto"
            />
            <Kpi
              label="Óbitos nesse grupo"
              value={formatCount(deaths)}
              detail={`${formatPercent(percentOf(deaths, total))} das ${formatCount(total)} mulheres`}
            />
          </div>
          {option && (
            <EChartView
              option={option}
              height={340}
              ariaLabel="Desfecho dos casos por grupo gestacional, em barras empilhadas"
            />
          )}
          <p className="mt-2 text-xs text-body dark:text-bodydark">
            Cada barra soma 100% dos casos do grupo (n = casos). * Menos de {data.min_cases} casos:
            percentual pouco confiável.
          </p>
        </>
      )}
    </ChartCard>
  );
}
