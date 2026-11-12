import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import { getSeverityCascade } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import {
  casesCaption,
  ClinicalRow,
  LethalityPill,
  Meter,
  ReliabilityNote,
  ToneLegend,
} from './ClinicalBars';
import { cascadeHeadline, lethalityTone } from './clinicalProfile';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchCascade = (filters: SragFilters) => getSeverityCascade(filters);
const STEP_COLOR = '#3C50E0';

export default function SeverityCascadeCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchCascade, filters);
  const data = slice.data;
  const baseline = data?.steps[0]?.lethality ?? null;
  const headline = data ? cascadeHeadline(data) : null;

  return (
    <ChartCard
      title="Gravidade: quantos casos chegam a cada etapa"
      subtitle="Dos casos notificados, quantos são internados, vão para a UTI e precisam de ventilação invasiva, e quão letal é cada etapa."
      help="A barra mostra a parte dos casos notificados que chega à etapa. O selo mostra a letalidade (óbitos ÷ casos com desfecho conhecido) entre esses casos, comparada à letalidade geral. Quem está na UTI também conta como internado."
      status={toCardStatus(slice, (current) => current.total === 0)}
      refreshing={isRefreshing(slice)}
    >
      {data && (
        <>
          {headline && (
            <p className="mb-5 text-base font-medium text-black dark:text-white">{headline}</p>
          )}
          <ul className="space-y-4">
            {data.steps.map((step) => {
              const tone = lethalityTone(step.lethality, baseline);
              return (
                <ClinicalRow
                  key={step.key}
                  label={step.label}
                  caption={casesCaption(step.cases)}
                  trailing={
                    <LethalityPill value={step.lethality} tone={tone} reliable={step.reliable} />
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <Meter
                        width={Math.min(100, step.pct)}
                        color={STEP_COLOR}
                        ariaLabel={`${step.label}: ${step.pct}% dos casos`}
                      />
                    </div>
                    <strong className="w-14 text-right text-sm text-black dark:text-white">
                      {step.pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
                    </strong>
                  </div>
                </ClinicalRow>
              );
            })}
          </ul>
          <ToneLegend baseline={baseline} />
          <ReliabilityNote />
        </>
      )}
    </ChartCard>
  );
}
