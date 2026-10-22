import { useMemo } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import { buildStayCurveOption } from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import { getHospitalStay } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import Kpi, { formatCount, formatDays } from './Kpi';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchStay = (filters: SragFilters) => getHospitalStay(filters);

export default function HospitalStayCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchStay, filters);
  const theme = chartTheme(useIsDark());
  const data = slice.data;
  const option = useMemo(
    () => (data && data.curve.length > 0 ? buildStayCurveOption(data.curve, theme) : null),
    [data, theme],
  );

  return (
    <ChartCard
      title="Tempo de internação"
      subtitle="Quantos dias os pacientes ficam internados e quão cedo recebem alta ou morrem."
      help="Conta só os casos que terminaram em cura ou óbito, com data de internação e de desfecho válidas (de 0 a 90 dias). Quem ainda está internado não entra, então os números valem para os casos já encerrados. As linhas mostram, para cada dia, que parte desses casos já tinha tido alta ou morrido até ali. Leitos-dia é a soma dos dias de internação; a ocupação média divide esse total pelo período dos primeiros sintomas no filtro."
      status={toCardStatus(slice, (current) => current.closed === 0)}
      refreshing={isRefreshing(slice)}
    >
      {data && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label="Mediana de internação"
              value={formatDays(data.median_days)}
              detail={`média de ${formatDays(data.mean_days)}, em ${formatCount(data.closed)} casos encerrados`}
            />
            <Kpi
              label="Mediana de quem teve alta"
              value={formatDays(data.median_cure_days)}
              detail="do dia da internação até a alta"
            />
            <Kpi
              label="Mediana de quem morreu"
              value={formatDays(data.median_death_days)}
              detail="do dia da internação até o óbito"
            />
            <Kpi
              label="Leitos-dia consumidos"
              value={formatCount(data.bed_days)}
              detail={
                data.daily_census === null
                  ? 'ocupação média indisponível'
                  : `ocupação média de ${String(data.daily_census).replace('.', ',')} pacientes por dia`
              }
            />
          </div>
          {option && (
            <EChartView
              option={option}
              height={340}
              ariaLabel="Percentual de pacientes com alta e com óbito ao longo dos dias de internação, em linhas"
            />
          )}
          <p className="mt-2 text-xs text-body dark:text-bodydark">
            Cada linha é a parte dos casos encerrados que já teve aquele desfecho até o dia
            indicado. As duas somam 100% quando todos os casos já terminaram.
          </p>
        </>
      )}
    </ChartCard>
  );
}
