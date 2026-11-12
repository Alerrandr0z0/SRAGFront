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
      subtitle="Quantas vezes a chance de óbito é maior em quem tem cada fator, comparado a quem não tem (casos com desfecho conhecido)."
      help="×1 (linha tracejada) significa nenhuma diferença. Barra para a direita: maior chance de óbito (×3 = três vezes maior); para a esquerda: menor chance. Cinza: a diferença pode ser acaso (o intervalo de confiança de 95% inclui ×1). Passe o mouse para ver o intervalo."
      status={toCardStatus(slice, (data) => prepareOddsRatio(data).rows.length === 0)}
      refreshing={isRefreshing(slice)}
    >
      <EChartView option={option} height={height} ariaLabel="Odds Ratio por fator de risco" />
      <p className="mt-2 flex flex-wrap gap-x-4 text-xs text-body dark:text-bodydark">
        <span>
          <span className="text-[#DC2626]">●</span> Maior chance de óbito
        </span>
        <span>
          <span className="text-[#3C50E0]">●</span> Menor chance de óbito
        </span>
        <span>
          <span className="text-[#94A3B8]">●</span> Diferença pode ser acaso
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
