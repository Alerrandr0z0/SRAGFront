import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import { formatPercent } from '../../../components/Charts/Analytics/chartOptions';
import { getVaccineJourney, type VaccineJourneyStage } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import Kpi, { formatCount, formatDays } from './Kpi';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchJourney = (filters: SragFilters) => getVaccineJourney(filters);

const pctOrDash = (value: number | null) => (value === null ? '—' : formatPercent(value));

const stageLabel = (stage: string) => (stage === 'Ignorado' ? 'Sem informação de vacina' : stage);

/** Cura (verde) e óbito (vermelho) entre os casos que já terminaram. */
function OutcomeSplit({ stage }: { stage: VaccineJourneyStage }) {
  if (stage.cure_pct === null || stage.death_pct === null) {
    return <span className="text-body dark:text-bodydark">sem desfecho</span>;
  }
  return (
    <div className="min-w-[160px]">
      <div
        role="img"
        aria-label={`Cura ${formatPercent(stage.cure_pct)}, óbito ${formatPercent(stage.death_pct)}`}
        className="flex h-3 overflow-hidden rounded-full bg-gray-2 dark:bg-meta-4"
      >
        <div className="bg-[#10B981]" style={{ width: `${stage.cure_pct}%` }} />
        <div className="bg-[#DC2626]" style={{ width: `${stage.death_pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-body dark:text-bodydark">
        Cura {formatPercent(stage.cure_pct)} · Óbito {formatPercent(stage.death_pct)}
      </p>
    </div>
  );
}

export default function VaccineJourneyCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchJourney, filters);
  const data = slice.data;
  const vaccinated = data?.stages.filter(
    (stage) => stage.stage !== 'Não vacinado' && stage.stage !== 'Ignorado',
  );
  const unvaccinated = data?.stages.find((stage) => stage.stage === 'Não vacinado');
  const vaccinatedResolved = vaccinated?.reduce((sum, stage) => sum + stage.resolved, 0) ?? 0;
  const vaccinatedDeaths =
    vaccinated?.reduce((sum, stage) => sum + ((stage.death_pct ?? 0) / 100) * stage.resolved, 0) ??
    0;
  const vaccinatedDeathPct =
    vaccinatedResolved > 0 ? (vaccinatedDeaths / vaccinatedResolved) * 100 : null;

  return (
    <ChartCard
      title="Jornada do paciente por vacinação contra COVID-19"
      subtitle="Quanto tempo leva até internar, quanto tempo fica internado e como termina, em cada etapa da vacinação."
      help="A etapa vacinal é a dose mais avançada com data na ficha (1ª dose, esquema completo, reforços). Dias até internar = primeiros sintomas até a internação. Dias internado = internação até o desfecho, só para casos encerrados. UTI é a parte dos casos com informação de UTI que foi para a UTI. Cura e óbito são calculados só sobre os casos já encerrados. Os grupos são pequenos e o perfil dos pacientes muda de uma etapa para outra (por exemplo, idosos recebem mais reforços), então esta tabela descreve, mas não prova efeito da vacina."
      status={toCardStatus(slice, (current) => current.stages.length === 0)}
      refreshing={isRefreshing(slice)}
    >
      {data && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Kpi
              label="Óbito entre não vacinados"
              value={pctOrDash(unvaccinated?.death_pct ?? null)}
              detail={`${formatCount(unvaccinated?.resolved ?? 0)} casos encerrados`}
            />
            <Kpi
              label="Óbito entre quem tinha alguma dose"
              value={pctOrDash(vaccinatedDeathPct)}
              detail={`${formatCount(vaccinatedResolved)} casos encerrados`}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stroke text-xs uppercase text-body dark:border-strokedark dark:text-bodydark">
                  <th scope="col" className="px-3 py-2 font-medium">
                    Etapa vacinal
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Casos
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Dias até internar
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Dias internado
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Foram à UTI
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Desfecho
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.stages.map((stage) => {
                  const small = stage.total < data.min_cases;
                  return (
                    <tr
                      key={stage.stage}
                      className={`border-b border-stroke last:border-0 dark:border-strokedark ${
                        stage.stage === 'Ignorado' ? 'text-body dark:text-bodydark' : ''
                      }`}
                    >
                      <td className="px-3 py-2 font-medium text-black dark:text-white">
                        {stageLabel(stage.stage)}
                        {small && (
                          <span
                            title={`Menos de ${data.min_cases} casos: números pouco confiáveis`}
                          >
                            {' *'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">{formatCount(stage.total)}</td>
                      <td className="px-3 py-2 text-right">
                        {formatDays(stage.median_days_to_hospital)}
                      </td>
                      <td className="px-3 py-2 text-right">{formatDays(stage.median_stay_days)}</td>
                      <td className="px-3 py-2 text-right">{pctOrDash(stage.icu_pct)}</td>
                      <td className="px-3 py-2">
                        <OutcomeSplit stage={stage} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-body dark:text-bodydark">
            Dias são medianas: metade dos casos fica abaixo do valor. * Menos de {data.min_cases}{' '}
            casos: os números mudam muito com um paciente a mais ou a menos.
          </p>
        </>
      )}
    </ChartCard>
  );
}
