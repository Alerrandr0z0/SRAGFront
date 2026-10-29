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
import { getAnimalContact } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import Kpi, { formatCount } from './Kpi';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchAnimals = (filters: SragFilters) => getAnimalContact(filters);

export default function AnimalContactCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchAnimals, filters);
  const theme = chartTheme(useIsDark());
  const data = slice.data;
  const answered = data ? data.total - data.ignored : 0;
  const option = useMemo(
    () =>
      data
        ? buildRankedBarsOption(data.items, theme, {
            base: answered,
            color: '#0FADCF',
            labelWidth: 150,
          })
        : null,
    [data, answered, theme],
  );
  const withContact = data?.items.filter((item) => item.label !== 'Sem contato') ?? [];
  const contactCount = withContact.reduce((sum, item) => sum + item.count, 0);

  return (
    <ChartCard
      title="Contato com aves, suínos e outros animais"
      subtitle="Uma pista para gripe de origem animal, como a influenza aviária."
      help="Pergunta da ficha de notificação sobre contato com aves, suínos ou outros animais. Casos sem resposta ou marcados como ignorados não entram no gráfico, e os percentuais são calculados só sobre quem respondeu. A maioria dos casos costuma ser 'Sem contato'."
      status={toCardStatus(slice, (current) => current.items.every((item) => item.count === 0))}
      refreshing={isRefreshing(slice)}
    >
      {data && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Kpi
              label="Tiveram contato com animais"
              value={formatPercent(percentOf(contactCount, answered))}
              detail={`${formatCount(contactCount)} de ${formatCount(answered)} que responderam`}
            />
            <Kpi
              label="Sem resposta ou ignorado"
              value={formatPercent(percentOf(data.ignored, data.total))}
              detail={`${formatCount(data.ignored)} de ${formatCount(data.total)} casos`}
            />
          </div>
          {option && (
            <EChartView
              option={option}
              height={200}
              ariaLabel="Contato com animais entre os casos, em barras horizontais"
            />
          )}
        </>
      )}
    </ChartCard>
  );
}
