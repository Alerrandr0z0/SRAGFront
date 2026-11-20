import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import { formatPercent } from '../../../components/Charts/Analytics/chartOptions';
import { getAntiviralDelayByAge } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import { ClinicalRow } from './ClinicalBars';
import { barWidth } from './clinicalProfile';
import Kpi, { formatCount, formatDays } from './Kpi';
import { antiviralHeadline } from './newIndicators';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchDelay = (filters: SragFilters) => getAntiviralDelayByAge(filters);

const TIMELY_COLOR = '#10B981';
const LATE_COLOR = '#F59E0B';
const MIN_TREATED = 10;

const pctOrDash = (value: number | null) => (value === null ? '—' : formatPercent(value));

export default function AntiviralByAgeCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchDelay, filters);
  const data = slice.data;
  const headline = data ? antiviralHeadline(data) : null;

  return (
    <ChartCard
      title="Atraso do antiviral por faixa etária"
      subtitle="Em cada idade, quantos começam o antiviral em até 2 dias dos primeiros sintomas?"
      help="Considera os casos tratados com antiviral com data de início de 0 a 14 dias após os primeiros sintomas. A barra verde é a parte que começou em até 2 dias; a âmbar, a que começou depois. “Não tratados” é a parcela dos casos com antiviral informado que não o recebeu."
      status={toCardStatus(slice, (current) => (current.overall?.treated ?? 0) === 0)}
      refreshing={isRefreshing(slice)}
    >
      {data?.overall && (
        <>
          {headline && (
            <p className="mb-5 text-base font-medium text-black dark:text-white">{headline}</p>
          )}
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Kpi
              label="Mediana até o antiviral"
              value={formatDays(data.overall.median_days)}
              detail={`${formatCount(data.overall.treated)} tratados com data válida`}
            />
            <Kpi
              label={`Começam em até ${data.timely_days} dias`}
              value={pctOrDash(data.overall.timely_pct)}
              detail="entre todos os tratados"
            />
            <Kpi
              label="Casos sem antiviral"
              value={pctOrDash(data.overall.untreated_pct)}
              detail="entre os casos com antiviral informado"
            />
          </div>
          <ul className="space-y-4">
            {data.bands.map((band) => {
              const timely = band.timely_pct ?? 0;
              return (
                <ClinicalRow
                  key={band.key}
                  label={band.label}
                  caption={`${formatCount(band.treated)} tratados · mediana ${formatDays(band.median_days)}`}
                  trailing={
                    <span className="text-sm text-body dark:text-bodydark">
                      <strong className="text-base text-black dark:text-white">
                        {pctOrDash(band.timely_pct)}
                        {band.treated > 0 && band.treated < MIN_TREATED ? '*' : ''}
                      </strong>{' '}
                      em até {data.timely_days} dias
                    </span>
                  }
                >
                  {band.timely_pct === null ? (
                    <p className="text-xs text-body dark:text-bodydark">Sem tratados com data</p>
                  ) : (
                    <div
                      role="img"
                      aria-label={`${band.label}: ${pctOrDash(band.timely_pct)} começam em até ${data.timely_days} dias`}
                      className={`flex h-5 overflow-hidden rounded bg-gray-2 dark:bg-meta-4 ${band.reliable ? '' : 'opacity-50'}`}
                    >
                      <div
                        style={{
                          width: `${barWidth(timely, 100)}%`,
                          backgroundColor: TIMELY_COLOR,
                        }}
                      />
                      <div
                        style={{
                          width: `${100 - barWidth(timely, 100)}%`,
                          backgroundColor: LATE_COLOR,
                        }}
                      />
                    </div>
                  )}
                  {band.untreated_pct !== null && (
                    <p className="text-xs text-body dark:text-bodydark">
                      {pctOrDash(band.untreated_pct)} não tratados
                    </p>
                  )}
                </ClinicalRow>
              );
            })}
          </ul>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-body dark:text-bodydark">
            <li>
              <span style={{ color: TIMELY_COLOR }}>●</span> Em até {data.timely_days} dias
            </li>
            <li>
              <span style={{ color: LATE_COLOR }}>●</span> Depois disso
            </li>
          </ul>
          <p className="mt-2 text-xs text-body dark:text-bodydark">
            * Menos de {MIN_TREATED} tratados com data: leia com cautela.
          </p>
        </>
      )}
    </ChartCard>
  );
}
