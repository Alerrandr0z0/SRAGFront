import { useMemo } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import {
  buildSamplePositivityOption,
  formatPercent,
} from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import { getSamplePositivity } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import Kpi, { formatCount } from './Kpi';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchPositivity = (filters: SragFilters) => getSamplePositivity(filters);

export default function SamplePositivityCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchPositivity, filters);
  const theme = chartTheme(useIsDark());
  const data = slice.data;
  const option = useMemo(
    () => (data && data.types.length > 0 ? buildSamplePositivityOption(data, theme) : null),
    [data, theme],
  );
  const height = Math.max(200, (data?.types.length ?? 0) * 56 + 50);

  return (
    <ChartCard
      title="Positividade por tipo de amostra"
      subtitle="De cada 100 casos com resultado, quantos deram positivo (RT-PCR ou antígeno), por tipo de amostra."
      help="Positivo = RT-PCR detectável ou antígeno positivo. Considera só casos com resultado disponível. Entre parênteses, quantos casos tiveram resultado naquele tipo de amostra. Tipos com poucos casos ficam de fora, porque o percentual oscila muito."
      status={toCardStatus(slice, (current) => current.overall.tested === 0)}
      refreshing={isRefreshing(slice)}
    >
      {data && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Kpi
              label="Positividade geral"
              value={data.overall.pct === null ? '—' : formatPercent(data.overall.pct)}
              detail={`${formatCount(data.overall.positive)} positivos em ${formatCount(data.overall.tested)} casos com resultado`}
            />
          </div>
          {option ? (
            <EChartView
              option={option}
              height={height}
              ariaLabel="Positividade por tipo de amostra, em barras horizontais"
            />
          ) : (
            <p className="py-12 text-center text-sm text-body dark:text-bodydark">
              Nenhum tipo de amostra tem pelo menos {data.min_tested} casos com resultado.
            </p>
          )}
          {data.hidden.length > 0 && (
            <p className="mt-2 text-xs text-body dark:text-bodydark">
              Sem casos suficientes (menos de {data.min_tested} com resultado) para exibir:{' '}
              {data.hidden.join(', ')}.
            </p>
          )}
        </>
      )}
    </ChartCard>
  );
}
