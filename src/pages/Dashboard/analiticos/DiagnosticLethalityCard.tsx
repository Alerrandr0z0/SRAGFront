import { useMemo } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import {
  buildDiagnosticLethalityOption,
  formatPercent,
} from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import { getDiagnosticLethality } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchLethality = (filters: SragFilters) => getDiagnosticLethality(filters);

export default function DiagnosticLethalityCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchLethality, filters);
  const theme = chartTheme(useIsDark());
  const data = slice.data;
  const option = useMemo(
    () => (data && data.methods.length > 0 ? buildDiagnosticLethalityOption(data, theme) : null),
    [data, theme],
  );
  const overall = data?.overall.cfr;
  const height = Math.max(200, (data?.methods.length ?? 0) * 52 + 50);

  return (
    <ChartCard
      title="Letalidade por método de confirmação"
      subtitle={
        overall === null || overall === undefined
          ? 'De cada 100 casos com desfecho conhecido, quantos evoluíram para óbito, por método.'
          : `De cada 100 casos com desfecho conhecido, quantos evoluíram para óbito. Média geral: ${formatPercent(overall)}.`
      }
      help="Vermelho: letalidade acima da média geral; azul: igual ou abaixo. Entre parênteses, o número de casos com desfecho conhecido. Passe o mouse para ver o tempo mediano da notificação até o desfecho e a proporção que foi para a UTI. Um método de confirmação mais usado em casos graves tende a mostrar letalidade maior, sem que o método seja a causa."
      status={toCardStatus(slice, (current) => current.overall.resolved === 0)}
      refreshing={isRefreshing(slice)}
    >
      {data && (
        <>
          {option ? (
            <EChartView
              option={option}
              height={height}
              ariaLabel="Letalidade por método de confirmação, em barras horizontais"
            />
          ) : (
            <p className="py-12 text-center text-sm text-body dark:text-bodydark">
              Nenhum método tem pelo menos {data.min_resolved} casos com desfecho conhecido.
            </p>
          )}
          {data.hidden.length > 0 && (
            <p className="mt-2 text-xs text-body dark:text-bodydark">
              Sem casos suficientes (menos de {data.min_resolved} com desfecho) para exibir:{' '}
              {data.hidden.join(', ')}.
            </p>
          )}
        </>
      )}
    </ChartCard>
  );
}
