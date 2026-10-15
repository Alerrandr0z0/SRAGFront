import { useMemo, useState } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import {
  buildDiagnosticMethodsOption,
  formatPercent,
  percentOf,
} from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import { getDiagnosticMethods, type IcuGranularity } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import GranularityToggle from './GranularityToggle';
import Kpi, { formatCount } from './Kpi';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchMethods = (filters: SragFilters, granularity: string) =>
  getDiagnosticMethods(filters, granularity as IcuGranularity);

export default function DiagnosticMethodsCard({ filters }: { filters: SragFilters }) {
  const [granularity, setGranularity] = useState<IcuGranularity>('year');
  const slice = useAnalyticsData(fetchMethods, filters, granularity);
  const theme = chartTheme(useIsDark());
  const data = slice.data;
  const option = useMemo(
    () => (data && data.periods.length > 0 ? buildDiagnosticMethodsOption(data, theme) : null),
    [data, theme],
  );

  return (
    <ChartCard
      title="Como os casos foram confirmados"
      subtitle="Capacidade de testagem: quanto da confirmação vem de exame laboratorial e quanto é clínica."
      help="Tons de azul: confirmação por exame (RT-PCR, antígeno e outros laboratoriais). Âmbar e cinza: critério clínico-epidemiológico, clínico, de imagem ou sem critério informado. Quanto mais azul, maior a capacidade de testagem no período."
      status={toCardStatus(slice, (current) => current.summary.total === 0)}
      refreshing={isRefreshing(slice)}
      actions={<GranularityToggle value={granularity} onChange={setGranularity} />}
    >
      {data && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Kpi
              label="Confirmados por laboratório"
              value={formatPercent(data.summary.laboratory_pct)}
              detail={`${formatCount(data.summary.rt_pcr + data.summary.antigeno_outros)} de ${formatCount(data.summary.total)} casos`}
            />
            <Kpi
              label="Confirmados por RT-PCR"
              value={formatPercent(data.summary.rt_pcr_pct)}
              detail={`${formatCount(data.summary.rt_pcr)} casos`}
            />
            <Kpi
              label="Confirmados por critério clínico-epidemiológico"
              value={formatPercent(percentOf(data.summary.clinico_epi, data.summary.total))}
              detail={`${formatCount(data.summary.clinico_epi)} casos`}
            />
          </div>
          {option ? (
            <EChartView
              option={option}
              height={380}
              ariaLabel="Método de confirmação dos casos, em barras empilhadas por período"
            />
          ) : (
            <p className="py-12 text-center text-sm text-body dark:text-bodydark">
              Nenhum período tem pelo menos {data.min_cases} casos. Tente agrupar por um período
              maior.
            </p>
          )}
          <p className="mt-2 text-xs text-body dark:text-bodydark">
            Períodos pela data dos primeiros sintomas. Cada barra soma 100% dos casos do período (n
            = total); períodos com menos de {data.min_cases} casos não são exibidos.
          </p>
        </>
      )}
    </ChartCard>
  );
}
