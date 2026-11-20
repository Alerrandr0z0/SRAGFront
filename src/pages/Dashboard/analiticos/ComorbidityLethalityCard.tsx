import { useMemo } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import {
  buildComorbidityLethalityOption,
  prepareComorbidityLethality,
} from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import { getComorbidityLethality } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchComorbidities = (filters: SragFilters) => getComorbidityLethality(filters);

export default function ComorbidityLethalityCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchComorbidities, filters);
  const theme = chartTheme(useIsDark());
  const plot = useMemo(
    () => (slice.data ? prepareComorbidityLethality(slice.data) : null),
    [slice.data],
  );
  const option = useMemo(
    () => (plot && plot.rows.length > 0 ? buildComorbidityLethalityOption(plot, theme) : null),
    [plot, theme],
  );
  const height = Math.max(200, (plot?.rows.length ?? 0) * 44 + 50);

  return (
    <ChartCard
      title="Letalidade por comorbidade"
      subtitle="Percentual de óbitos entre os casos com cada comorbidade que tiveram desfecho conhecido (cura ou óbito)."
      help="Letalidade = óbitos ÷ casos com a comorbidade e desfecho conhecido, em %. Entre parênteses: óbitos de casos com desfecho conhecido (ex.: 42 de 72 = 58,3%). Casos sem desfecho registrado ficam fora da conta. Percentuais calculados com poucos casos oscilam muito, e a letalidade não separa o efeito da comorbidade do de outros fatores, como a idade."
      status={toCardStatus(slice, (data) => prepareComorbidityLethality(data).rows.length === 0)}
      refreshing={isRefreshing(slice)}
    >
      {option && (
        <EChartView
          option={option}
          height={height}
          ariaLabel="Letalidade por comorbidade, em barras horizontais"
        />
      )}
      {plot && plot.omitted.length > 0 && (
        <p className="mt-2 text-xs text-body dark:text-bodydark">
          Sem casos com desfecho conhecido para calcular: {plot.omitted.join(', ')}.
        </p>
      )}
    </ChartCard>
  );
}