import { useMemo, useState } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import { buildUnitDelayOption } from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import { getUnitNotificationDelay } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import Kpi, { formatCount, formatDays } from './Kpi';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchDelay = (filters: SragFilters) => getUnitNotificationDelay(filters);

/** Quantas unidades aparecem de início: as piores, para o gráfico não ficar enorme. */
const TOP_UNITS = 15;

export default function UnitDelayCard({ filters }: { filters: SragFilters }) {
  const [showAll, setShowAll] = useState(false);
  const slice = useAnalyticsData(fetchDelay, filters);
  const theme = chartTheme(useIsDark());
  const data = slice.data;

  const rows = useMemo(
    () => (data ? (showAll ? data.units : data.units.slice(0, TOP_UNITS)) : []),
    [data, showAll],
  );
  const option = useMemo(
    () => (data && rows.length > 0 ? buildUnitDelayOption(rows, data.limit_days, theme) : null),
    [data, rows, theme],
  );
  const critical = data?.units.filter((row) => row.status === 'critico').length ?? 0;
  const slowest = data?.units[0];

  return (
    <ChartCard
      title="Atraso de notificação por unidade"
      subtitle="Quanto tempo cada unidade leva para notificar um caso depois dos primeiros sintomas."
      help="Atraso = data da notificação menos a data dos primeiros sintomas (de 0 a 60 dias). A barra é a mediana da unidade: metade dos casos foi notificada em menos tempo que isso. Verde: até 5 dias. Amarelo: até 10 dias. Vermelho: mais de 10. A linha tracejada marca os 7 dias de limite aceitável. O atraso também depende de quando o paciente procura atendimento, não só da unidade."
      status={toCardStatus(
        slice,
        (current) => current.units.length === 0 && current.hidden_count === 0,
      )}
      refreshing={isRefreshing(slice)}
    >
      {data && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Kpi
              label="Unidades analisadas"
              value={formatCount(data.units.length)}
              detail={`com pelo menos ${data.min_cases} casos com datas válidas`}
            />
            <Kpi
              label={`Atraso crítico (mediana acima de ${data.critical_days} dias)`}
              value={formatCount(critical)}
              detail={`de ${formatCount(data.units.length)} unidades`}
            />
            <Kpi
              label="Maior atraso"
              value={formatDays(slowest?.median_days)}
              detail={slowest?.unit ?? 'sem unidades suficientes'}
            />
          </div>

          {option ? (
            <EChartView
              option={option}
              height={rows.length * 30 + 70}
              ariaLabel="Mediana do atraso de notificação por unidade, em barras horizontais"
            />
          ) : (
            <p className="py-12 text-center text-sm text-body dark:text-bodydark">
              Nenhuma unidade tem pelo menos {data.min_cases} casos com datas válidas.
            </p>
          )}

          {data.units.length > TOP_UNITS && (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="mt-3 rounded border border-stroke px-3 py-1.5 text-sm text-black transition hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
            >
              {showAll
                ? `Mostrar só as ${TOP_UNITS} com maior atraso`
                : `Mostrar todas as ${data.units.length} unidades`}
            </button>
          )}
          <p className="mt-2 text-xs text-body dark:text-bodydark">
            Ordenado do maior para o menor atraso. Unidades com menos de {data.min_cases} casos não
            aparecem
            {data.hidden_count > 0 ? ` (${data.hidden_count} ficaram de fora)` : ''}, assim como os
            casos sem unidade informada.
          </p>
        </>
      )}
    </ChartCard>
  );
}
