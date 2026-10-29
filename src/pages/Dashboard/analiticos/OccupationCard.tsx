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
import { getOccupationProfile } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import Kpi, { formatCount } from './Kpi';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchOccupation = (filters: SragFilters) => getOccupationProfile(filters);

const capitalize = (text: string) => text.charAt(0) + text.slice(1).toLowerCase();

export default function OccupationCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchOccupation, filters);
  const theme = chartTheme(useIsDark());
  const data = slice.data;
  const option = useMemo(
    () =>
      data
        ? buildRankedBarsOption(
            data.items.map((item) => ({ ...item, label: capitalize(item.label) })),
            theme,
            { base: data.informed, labelWidth: 260 },
          )
        : null,
    [data, theme],
  );
  const top = data?.items[0];

  return (
    <ChartCard
      title="Ocupação dos pacientes"
      subtitle="As 15 profissões que mais aparecem entre os casos notificados."
      help="Usa a descrição da ocupação (CBO) informada na ficha. Casos sem ocupação ou marcados como ignorados ficam de fora do gráfico, e os percentuais são calculados só sobre quem informou. Ocupações aparecem como foram digitadas, então a mesma profissão pode estar dividida em nomes parecidos."
      status={toCardStatus(slice, (current) => current.items.length === 0)}
      refreshing={isRefreshing(slice)}
    >
      {data && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Kpi
              label="Ocupação mais frequente"
              value={<span className="text-lg">{top ? capitalize(top.label) : '—'}</span>}
              detail={top ? `${formatCount(top.count)} casos` : 'sem ocupação informada'}
            />
            <Kpi
              label="Casos com ocupação informada"
              value={formatPercent(percentOf(data.informed, data.total))}
              detail={`${formatCount(data.informed)} de ${formatCount(data.total)} casos`}
            />
          </div>
          {option && (
            <EChartView
              option={option}
              height={Math.max(260, data.items.length * 30 + 40)}
              ariaLabel="Ocupações mais frequentes entre os casos, em barras horizontais"
            />
          )}
        </>
      )}
    </ChartCard>
  );
}
