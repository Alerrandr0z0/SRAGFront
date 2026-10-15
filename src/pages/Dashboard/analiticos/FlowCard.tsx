import { useMemo } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import { buildSankeyOption } from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import { getClinicalFlow } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchFlow = (filters: SragFilters) => getClinicalFlow(filters);

export default function FlowCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchFlow, filters);
  const theme = chartTheme(useIsDark());
  const option = useMemo(
    () => (slice.data ? buildSankeyOption(slice.data, theme) : null),
    [slice.data, theme],
  );

  return (
    <ChartCard
      title="Fluxo da jornada clínica"
      subtitle="Origem da infecção → internação (UTI ou enfermaria) → suporte ventilatório → desfecho."
      help="Cada faixa mostra quantos casos seguiram aquele caminho. Ao passar o mouse, a porcentagem é calculada sobre o total que saiu da etapa anterior."
      status={toCardStatus(slice, (data) => data.links.length === 0)}
      refreshing={isRefreshing(slice)}
    >
      <EChartView option={option} height={460} ariaLabel="Diagrama Sankey da jornada clínica" />
    </ChartCard>
  );
}
