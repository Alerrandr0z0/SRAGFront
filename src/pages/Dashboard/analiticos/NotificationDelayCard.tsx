import { useMemo, useState } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import {
  buildNotificationDelayOption,
  formatPercent,
} from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import {
  getNotificationDelay,
  type NotificationDelayStatus,
} from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import Kpi, { formatCount, formatDays } from './Kpi';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchDelay = (filters: SragFilters) => getNotificationDelay(filters);

/** Quantos bairros aparecem de início: os piores, para o gráfico não ficar enorme. */
const TOP_BAIRROS = 15;

const STATUS: Record<NotificationDelayStatus, { label: string; className: string }> = {
  adequado: { label: 'Adequado', className: 'bg-[#10B981]/15 text-[#0F766E] dark:text-[#34D399]' },
  atencao: { label: 'Atenção', className: 'bg-[#F59E0B]/15 text-[#B45309] dark:text-[#FBBF24]' },
  critico: { label: 'Crítico', className: 'bg-[#DC2626]/15 text-[#B91C1C] dark:text-[#F87171]' },
};

export default function NotificationDelayCard({ filters }: { filters: SragFilters }) {
  const [showAll, setShowAll] = useState(false);
  const slice = useAnalyticsData(fetchDelay, filters);
  const theme = chartTheme(useIsDark());
  const data = slice.data;

  const rows = useMemo(
    () => (data ? (showAll ? data.bairros : data.bairros.slice(0, TOP_BAIRROS)) : []),
    [data, showAll],
  );
  const option = useMemo(
    () =>
      data && rows.length > 0 ? buildNotificationDelayOption(rows, data.limit_days, theme) : null,
    [data, rows, theme],
  );
  const critical = data?.bairros.filter((row) => row.status === 'critico').length ?? 0;
  const status = data?.overall.status ? STATUS[data.overall.status] : null;

  return (
    <ChartCard
      title="Atraso de notificação por bairro"
      subtitle="Quantos dias se passam entre os primeiros sintomas e a notificação do caso, em cada bairro."
      help="Atraso = data da notificação menos a data dos primeiros sintomas (de 0 a 60 dias). A barra é a mediana do bairro: metade dos casos foi notificada em menos tempo que isso. Verde: até 5 dias. Amarelo: até 10 dias. Vermelho: mais de 10. A linha tracejada marca os 7 dias de limite aceitável. Os nomes seguem os do mapa e da tabela de bairros."
      status={toCardStatus(slice, (current) => current.overall.total === 0)}
      refreshing={isRefreshing(slice)}
    >
      {data && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Kpi
              label="Mediana do atraso (todos os casos)"
              value={
                <>
                  {formatDays(data.overall.median_days)}
                  {status && (
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  )}
                </>
              }
              detail={`${formatCount(data.overall.total)} casos com datas válidas`}
            />
            <Kpi
              label={`Notificados em até ${data.limit_days} dias`}
              value={
                data.overall.within_limit_pct === null
                  ? '—'
                  : formatPercent(data.overall.within_limit_pct)
              }
              detail="dentro do limite aceitável"
            />
            <Kpi
              label={`Bairros com atraso crítico (mediana acima de ${data.critical_days} dias)`}
              value={formatCount(critical)}
              detail={`de ${formatCount(data.bairros.length)} bairros com pelo menos ${data.min_cases} casos`}
            />
          </div>

          {option ? (
            <EChartView
              option={option}
              height={rows.length * 30 + 70}
              ariaLabel="Mediana do atraso de notificação por bairro, em barras horizontais"
            />
          ) : (
            <p className="py-12 text-center text-sm text-body dark:text-bodydark">
              Nenhum bairro tem pelo menos {data.min_cases} casos com datas válidas.
            </p>
          )}

          {data.bairros.length > TOP_BAIRROS && (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="mt-3 rounded border border-stroke px-3 py-1.5 text-sm text-black transition hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
            >
              {showAll
                ? `Mostrar só os ${TOP_BAIRROS} com maior atraso`
                : `Mostrar todos os ${data.bairros.length} bairros`}
            </button>
          )}
          <p className="mt-2 text-xs text-body dark:text-bodydark">
            Ordenado do maior para o menor atraso. Bairros com menos de {data.min_cases} casos não
            aparecem
            {data.hidden_count > 0 ? ` (${data.hidden_count} ficaram de fora)` : ''}, assim como os
            casos sem bairro informado.
          </p>
        </>
      )}
    </ChartCard>
  );
}
