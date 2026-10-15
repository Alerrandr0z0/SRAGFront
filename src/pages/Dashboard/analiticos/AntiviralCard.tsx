import { useMemo } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import {
  buildAntiviralWindowsOption,
  formatPercent,
} from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import { getAntiviralWindows } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import Kpi, { formatDays } from './Kpi';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchAntiviral = (filters: SragFilters) => getAntiviralWindows(filters);

const pctOrDash = (value: number | null) => (value === null ? '—' : formatPercent(value));

export default function AntiviralCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchAntiviral, filters);
  const theme = chartTheme(useIsDark());
  const data = slice.data;
  const option = useMemo(
    () =>
      data?.windows.some((window) => window.total > 0)
        ? buildAntiviralWindowsOption(data, theme)
        : null,
    [data, theme],
  );

  return (
    <ChartCard
      title="Rapidez do antiviral e desfecho"
      subtitle="Quanto mais cedo o antiviral começa depois dos primeiros sintomas, melhor o desfecho?"
      help="Considera os casos tratados com antiviral com data de início de 0 a 14 dias após os primeiros sintomas, comparados aos que não usaram antiviral. Só entram casos que terminaram em cura ou óbito. Os grupos são pequenos: diferenças de poucos pontos podem ser acaso, então use como pista e não como prova."
      status={toCardStatus(slice, (current) => current.treated === 0)}
      refreshing={isRefreshing(slice)}
    >
      {data && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label="Mediana do início dos sintomas ao antiviral"
              value={formatDays(data.median_days)}
              detail={`${data.with_dates} dos ${data.treated} tratados têm datas válidas`}
            />
            <Kpi
              label="Tratados em até 2 dias"
              value={pctOrDash(data.within_2d_pct)}
              detail="dentro da janela ideal de tratamento"
            />
            <Kpi
              label="Cura entre os tratados em até 2 dias"
              value={pctOrDash(data.cure_within_2d_pct)}
              detail={`contra ${pctOrDash(data.cure_without_antiviral_pct)} entre os que não usaram antiviral`}
            />
            <Kpi
              label="Óbito entre os tratados após 5 dias"
              value={pctOrDash(data.death_after_5d_pct)}
              detail="tratamento tardio"
            />
          </div>
          {option ? (
            <EChartView
              option={option}
              height={360}
              ariaLabel="Cura e óbito por rapidez do início do antiviral, em barras empilhadas"
            />
          ) : (
            <p className="py-12 text-center text-sm text-body dark:text-bodydark">
              Nenhum caso tratado com desfecho conhecido nos filtros selecionados.
            </p>
          )}
          <p className="mt-2 text-xs text-body dark:text-bodydark">
            Cada barra soma 100% dos casos com desfecho cura ou óbito (n = casos). Prazo contado da
            data dos primeiros sintomas até o início do antiviral.
          </p>
        </>
      )}
    </ChartCard>
  );
}
