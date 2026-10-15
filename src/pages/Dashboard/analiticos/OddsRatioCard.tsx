import { useMemo } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import {
  buildOddsRatioOption,
  prepareOddsRatio,
} from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import { getOddsRatio } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchOddsRatio = (filters: SragFilters) => getOddsRatio(filters);

export default function OddsRatioCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchOddsRatio, filters);
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
