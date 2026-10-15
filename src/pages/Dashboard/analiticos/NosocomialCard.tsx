import { useMemo, useState } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import {
  buildNosocomialOption,
  formatPercent,
} from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import {
  getNosocomialRisk,
  type IcuGranularity,
  type OriginLethality,
} from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import GranularityToggle from './GranularityToggle';
import Kpi, { formatCount } from './Kpi';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchNosocomial = (filters: SragFilters, granularity: string) =>
  getNosocomialRisk(filters, granularity as IcuGranularity);

const lethalityValue = (origin: OriginLethality) =>
  origin.pct === null ? '—' : formatPercent(origin.pct);

const lethalityDetail = (origin: OriginLethality) =>
  `${formatCount(origin.deaths)} óbitos em ${formatCount(origin.resolved)} casos com desfecho`;

export default function NosocomialCard({ filters }: { filters: SragFilters }) {
  const [granularity, setGranularity] = useState<IcuGranularity>('quarter');
  const slice = useAnalyticsData(fetchNosocomial, filters, granularity);
  const theme = chartTheme(useIsDark());
  const data = slice.data;
  const option = useMemo(
    () => (data && data.periods.length > 0 ? buildNosocomialOption(data, theme) : null),
    [data, theme],
  );

  return (
    <ChartCard
      title="Infecção adquirida no hospital"
      subtitle="Quantos casos foram infecção hospitalar (nosocomial) em cada período, e quão mais letal ela é."
      help="Considera só os casos com origem informada (hospitalar ou comunitária). Barras vermelhas passaram do limite de alerta: a média dos períodos mais 3 desvios-padrão, que sinaliza um surto fora do comum. Esse limite só é calculado com 12 ou mais períodos, então use Trimestre ou Mês."
      status={toCardStatus(slice, (current) => current.summary.known === 0)}
      refreshing={isRefreshing(slice)}
      actions={<GranularityToggle value={granularity} onChange={setGranularity} />}
    >
      {data && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Kpi
              label="Casos de infecção hospitalar"
              value={formatPercent(data.summary.nosocomial_pct)}
              detail={`${formatCount(data.summary.nosocomial)} de ${formatCount(data.summary.known)} casos com origem informada`}
            />
            <Kpi
              label="Letalidade: infecção hospitalar"
              value={lethalityValue(data.summary.lethality.nosocomial)}
              detail={lethalityDetail(data.summary.lethality.nosocomial)}
            />
            <Kpi
              label="Letalidade: infecção comunitária"
              value={lethalityValue(data.summary.lethality.community)}
              detail={lethalityDetail(data.summary.lethality.community)}
            />
          </div>
          {option ? (
            <EChartView
              option={option}
              height={380}
              ariaLabel="Percentual de infecção hospitalar por período"
            />
          ) : (
            <p className="py-12 text-center text-sm text-body dark:text-bodydark">
              Nenhum período tem pelo menos {data.min_cases} casos com origem informada. Tente
              agrupar por um período maior.
            </p>
          )}
          <p className="mt-2 text-xs text-body dark:text-bodydark">
            {data.periods.length > 0 && data.alert_limit_pct === null
              ? 'Limite de alerta indisponível: precisa de 12 ou mais períodos (agrupe por trimestre ou mês). '
              : ''}
            Períodos pela data dos primeiros sintomas; n = casos com origem informada. Períodos com
            menos de {data.min_cases} casos não são exibidos.
          </p>
        </>
      )}
    </ChartCard>
  );
}
