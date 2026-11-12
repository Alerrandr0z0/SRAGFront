import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import { getFatalProfile } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import { ClinicalRow, Meter } from './ClinicalBars';
import { barWidth, MIN_RELIABLE_RESOLVED } from './clinicalProfile';
import { formatCount } from './Kpi';
import { fatalHeadline, fatalMetricRows, knownCount } from './newIndicators';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchProfile = (filters: SragFilters) => getFatalProfile(filters);

const DEATH_COLOR = '#DC2626';
const SURVIVOR_COLOR = '#94A3B8';

export default function FatalProfileCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchProfile, filters);
  const data = slice.data;
  const headline = data ? fatalHeadline(data) : null;
  const rows = data ? fatalMetricRows(data) : [];

  return (
    <ChartCard
      title="Perfil de quem morre"
      subtitle="Idade mediana, % sem vacina e % com fator de risco: óbitos contra sobreviventes."
      help="Óbito = evolução “óbito”; sobrevivente = evolução “cura”. “Sem vacina” considera quem não tem nenhuma dose de influenza nem de COVID-19 registrada, entre os casos com a vacinação informada. “Com fator de risco” considera ao menos uma comorbidade da lista, entre os casos em que o campo foi preenchido. Casos com a informação ignorada ficam fora do percentual."
      status={toCardStatus(slice, (current) => !current.deaths || current.deaths.count === 0)}
      refreshing={isRefreshing(slice)}
    >
      {data?.deaths && (
        <>
          {headline && (
            <p className="mb-5 text-base font-medium text-black dark:text-white">{headline}</p>
          )}
          <ul className="space-y-5">
            {rows.map((row) => (
              <ClinicalRow
                key={row.key}
                label={row.label}
                caption={row.caption}
                trailing={
                  <span className="text-xs text-body dark:text-bodydark">
                    n = {formatCount(knownCount(data.deaths, row.key))} óbitos
                  </span>
                }
              >
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <Meter
                      width={barWidth(row.deaths, row.scale)}
                      color={DEATH_COLOR}
                      muted={!data.deaths?.reliable}
                      ariaLabel={`Óbitos, ${row.label}: ${row.format(row.deaths)}`}
                    />
                  </div>
                  <strong className="w-20 shrink-0 text-right text-sm text-black dark:text-white">
                    {row.format(row.deaths)}
                  </strong>
                </div>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <Meter
                      width={barWidth(row.survivors, row.scale)}
                      color={SURVIVOR_COLOR}
                      height="h-3"
                      muted={!data.survivors?.reliable}
                      ariaLabel={`Sobreviventes, ${row.label}: ${row.format(row.survivors)}`}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-xs text-body dark:text-bodydark">
                    {row.format(row.survivors)}
                  </span>
                </div>
              </ClinicalRow>
            ))}
          </ul>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-body dark:text-bodydark">
            <li>
              <span style={{ color: DEATH_COLOR }}>●</span> Óbitos ({formatCount(data.deaths.count)}
              )
            </li>
            <li>
              <span style={{ color: SURVIVOR_COLOR }}>●</span> Sobreviventes (
              {formatCount(data.survivors?.count ?? 0)})
            </li>
          </ul>
          {!data.deaths.reliable && (
            <p className="mt-2 text-xs text-body dark:text-bodydark">
              Menos de {MIN_RELIABLE_RESOLVED} óbitos no recorte: leia com cautela.
            </p>
          )}
        </>
      )}
    </ChartCard>
  );
}
