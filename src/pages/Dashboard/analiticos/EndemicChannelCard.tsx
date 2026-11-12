import { useMemo } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import { buildEndemicChannelOption } from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import { getEndemicChannel } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import { ENDEMIC_STATUS_COLORS, endemicHeadline, endemicMissingHistory } from './newIndicators';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchEndemic = (filters: SragFilters) => getEndemicChannel(filters);

export default function EndemicChannelCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchEndemic, filters);
  const theme = chartTheme(useIsDark());
  const data = slice.data;
  const ready = data?.enough_history === true;
  const option = useMemo(
    () => (data?.enough_history ? buildEndemicChannelOption(data, theme) : null),
    [data, theme],
  );
  const headline = data ? endemicHeadline(data) : null;

  return (
    <ChartCard
      title="Corredor endêmico: a semana está acima do esperado?"
      subtitle="Casos por semana epidemiológica contra a faixa dos anos anteriores."
      help="Para cada semana, a faixa verde vai do 1º ao 3º quartil dos casos dos anos anteriores (até 5 anos) e a linha tracejada é a mediana. A zona âmbar vai até o limite de alerta (3º quartil + 1,5 × a amplitude da faixa); acima dele a semana é epidêmica. O ano de referência é o ano selecionado no filtro ou, sem filtro, o mais recente. O filtro de ano não recorta este gráfico, porque os anos anteriores formam a faixa. Anos atípicos, como o início da pandemia, alargam a faixa. A semana 53 não entra. A última semana com casos costuma estar incompleta por atraso de notificação."
      status={toCardStatus(
        slice,
        (current) =>
          !current.enough_history &&
          current.weeks.length === 0 &&
          current.history_years.length === 0,
      )}
      refreshing={isRefreshing(slice)}
    >
      {data && !ready && (
        <p className="rounded border border-stroke px-4 py-6 text-sm text-body dark:border-strokedark dark:text-bodydark">
          {endemicMissingHistory(data)}
        </p>
      )}
      {data && ready && (
        <>
          {headline && data.current_status && (
            <p className="mb-3 text-base font-medium text-black dark:text-white">
              <span style={{ color: ENDEMIC_STATUS_COLORS[data.current_status] }}>● </span>
              {headline}
            </p>
          )}
          <EChartView
            option={option}
            height={340}
            ariaLabel="Casos por semana epidemiológica contra a faixa esperada"
          />
          <p className="mt-2 text-xs text-body dark:text-bodydark">
            Faixa calculada com {data.history_years.join(', ')}.{' '}
            {data.weeks_above > 0
              ? `${data.weeks_above} semana(s) de ${data.reference_year} acima da faixa.`
              : `Nenhuma semana de ${data.reference_year} acima da faixa.`}
          </p>
        </>
      )}
    </ChartCard>
  );
}
