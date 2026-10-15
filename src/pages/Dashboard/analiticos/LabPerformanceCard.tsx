import type { ReactNode } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import { formatPercent } from '../../../components/Charts/Analytics/chartOptions';
import { getLabPerformance } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import { formatCount, formatDays } from './Kpi';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchPerformance = (filters: SragFilters) => getLabPerformance(filters);

const pctOrDash = (value: number | null) => (value === null ? '—' : formatPercent(value));

interface MetricCardProps {
  title: string;
  value: string;
  detail: ReactNode;
  target: string;
  /** true = dentro da meta, false = fora, null = sem dados para avaliar. */
  ok: boolean | null;
}

function MetricCard({ title, value, detail, target, ok }: MetricCardProps) {
  const chip =
    ok === null
      ? { label: 'Sem dados', className: 'bg-gray-2 text-body dark:bg-meta-4 dark:text-bodydark' }
      : ok
        ? {
            label: 'Dentro da meta',
            className: 'bg-[#10B981]/15 text-[#0F766E] dark:text-[#34D399]',
          }
        : {
            label: 'Fora da meta',
            className: 'bg-[#DC2626]/15 text-[#B91C1C] dark:text-[#F87171]',
          };

  return (
    <div className="flex flex-col rounded border border-stroke px-4 py-3 dark:border-strokedark">
      <p className="text-xs text-body dark:text-bodydark">{title}</p>
      <p className="mt-1 text-3xl font-semibold text-black dark:text-white">{value}</p>
      <p className="mt-1 flex-1 text-xs text-body dark:text-bodydark">{detail}</p>
      <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-body dark:text-bodydark">
        <span className={`rounded px-2 py-0.5 font-medium ${chip.className}`}>{chip.label}</span>
        {target}
      </p>
    </div>
  );
}

export default function LabPerformanceCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchPerformance, filters);
  const data = slice.data;

  return (
    <ChartCard
      title="Qualidade do diagnóstico laboratorial"
      subtitle="Quatro indicadores de operação da rede de diagnóstico, cada um comparado com sua meta."
      help="Resultado laboratorial: casos com RT-PCR ou teste de antígeno com resultado disponível (resultados 'aguardando' não contam). Coleta: casos com amostra coletada. Os tempos usam a data da coleta e consideram só esperas de 0 a 30 dias; valores fora disso costumam ser erro de preenchimento."
      status={toCardStatus(slice, (current) => current.total === 0)}
      refreshing={isRefreshing(slice)}
    >
      {data && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Casos com resultado laboratorial"
            value={formatPercent(data.result.pct)}
            detail={`${formatCount(data.result.count)} de ${formatCount(data.total)} casos (RT-PCR ou antígeno)`}
            target={`Meta: pelo menos ${data.result.target_pct}%`}
            ok={data.result.pct >= data.result.target_pct}
          />
          <MetricCard
            title="Casos com amostra coletada"
            value={formatPercent(data.collection.pct)}
            detail={`${formatCount(data.collection.count)} de ${formatCount(data.total)} casos`}
            target={`Meta: pelo menos ${data.collection.target_pct}%`}
            ok={data.collection.pct >= data.collection.target_pct}
          />
          <MetricCard
            title="Coleta ao resultado do RT-PCR (mediana)"
            value={formatDays(data.rt_pcr_latency.median)}
            detail={`${pctOrDash(data.rt_pcr_latency.within_target_pct)} em até ${data.rt_pcr_latency.target_days} dias · P95: ${formatDays(data.rt_pcr_latency.p95)} · n=${formatCount(data.rt_pcr_latency.count)}`}
            target={`Meta: até ${data.rt_pcr_latency.target_days} dias`}
            ok={
              data.rt_pcr_latency.median === null
                ? null
                : data.rt_pcr_latency.median <= data.rt_pcr_latency.target_days
            }
          />
          <MetricCard
            title="Tempo de resposta (média)"
            value={formatDays(data.turnaround.mean)}
            detail={`Mediana: ${formatDays(data.turnaround.median)} · P90: ${formatDays(data.turnaround.p90)} · n=${formatCount(data.turnaround.count)}`}
            target={`Meta: até ${data.turnaround.target_days} dias`}
            ok={
              data.turnaround.mean === null
                ? null
                : data.turnaround.mean <= data.turnaround.target_days
            }
          />
        </div>
      )}
    </ChartCard>
  );
}
