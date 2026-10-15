import { useMemo, useState } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import {
  buildIcuAccessOption,
  formatPercent,
} from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import {
  getIcuAccess,
  type IcuGranularity,
  type IcuStatus,
} from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import GranularityToggle from './GranularityToggle';
import Kpi, { formatCount, formatDays } from './Kpi';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchIcuAccess = (filters: SragFilters, granularity: string) =>
  getIcuAccess(filters, granularity as IcuGranularity);

const STATUS: Record<IcuStatus, { label: string; className: string }> = {
  adequado: { label: 'Adequado', className: 'bg-[#10B981]/15 text-[#0F766E] dark:text-[#34D399]' },
  atencao: { label: 'Atenção', className: 'bg-[#F59E0B]/15 text-[#B45309] dark:text-[#FBBF24]' },
  critico: { label: 'Crítico', className: 'bg-[#DC2626]/15 text-[#B91C1C] dark:text-[#F87171]' },
};

export default function IcuAccessCard({ filters }: { filters: SragFilters }) {
  const [granularity, setGranularity] = useState<IcuGranularity>('year');
  const slice = useAnalyticsData(fetchIcuAccess, filters, granularity);
  const theme = chartTheme(useIsDark());
  const data = slice.data;
  const option = useMemo(
    () => (data && data.periods.length > 0 ? buildIcuAccessOption(data, theme) : null),
    [data, theme],
  );
  const status = data?.summary.status ? STATUS[data.summary.status] : null;
  const median = data?.summary.median_wait_days;

  return (
    <ChartCard
      title="Acesso à UTI"
      subtitle="Quanto tempo os pacientes esperaram entre a internação e a entrada na UTI."
      help="Espera = data de entrada na UTI menos a data da internação (de 0 a 30 dias). Verde: entrou no mesmo dia ou em até 3 dias (limite aceitável). Amarelo e vermelho: esperou mais de 3 dias. A mediana considera só quem esperou ao menos 1 dia: até 2 dias é adequado, até 4 é atenção e acima disso é crítico."
      status={toCardStatus(slice, (current) => current.summary.total === 0)}
      refreshing={isRefreshing(slice)}
      actions={<GranularityToggle value={granularity} onChange={setGranularity} />}
    >
      {data && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Kpi
              label="Entraram na UTI no mesmo dia"
              value={formatPercent(data.summary.same_day_pct)}
              detail={`${formatCount(data.summary.same_day)} de ${formatCount(data.summary.total)} admissões`}
            />
            <Kpi
              label={`Esperaram mais de ${data.limit_days} dias`}
              value={formatPercent(data.summary.over_limit_pct)}
              detail={`${formatCount(data.summary.over_limit)} admissões`}
            />
            <Kpi
              label="Mediana da espera (de quem esperou)"
              value={
                <>
                  {formatDays(median)}
                  {status && (
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  )}
                </>
              }
              detail="Quem entrou no mesmo dia não entra nesta conta"
            />
          </div>

          {option ? (
            <EChartView
              option={option}
              height={380}
              ariaLabel="Tempo de espera para a UTI, em barras empilhadas por período"
            />
          ) : (
            <p className="py-12 text-center text-sm text-body dark:text-bodydark">
              Nenhum período tem pelo menos {data.min_cases} admissões na UTI. Tente agrupar por um
              período maior.
            </p>
          )}
          <p className="mt-2 text-xs text-body dark:text-bodydark">
            Cada barra soma 100% das admissões do período (n = total). Períodos com menos de{' '}
            {data.min_cases} admissões na UTI não são exibidos.
          </p>
        </>
      )}
    </ChartCard>
  );
}
