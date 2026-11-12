import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import { getRiskFactorLoad } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import { casesCaption, ClinicalRow, Meter, ReliabilityNote, ToneLegend } from './ClinicalBars';
import {
  barWidth,
  formatLethality,
  lethalityTone,
  markerPosition,
  maxOf,
  riskHeadline,
  TONE_COLORS,
} from './clinicalProfile';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchLoad = (filters: SragFilters) => getRiskFactorLoad(filters);

export default function RiskFactorLoadCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchLoad, filters);
  const data = slice.data;
  const scale = data ? Math.max(maxOf(data.buckets.map((bucket) => bucket.lethality)), 1) : 1;
  const marker = data ? markerPosition(data.baseline, scale) : null;
  const headline = data ? riskHeadline(data) : null;

  return (
    <ChartCard
      title="Fatores de risco: quanto mais, maior a letalidade?"
      subtitle="Letalidade de quem não tem nenhum fator de risco, tem 1, 2 ou 3 ou mais."
      help={
        data && data.factors.length > 0
          ? `Conta só fatores informados como "sim": ${data.factors.join(', ').toLowerCase()}. Letalidade = óbitos ÷ casos com desfecho conhecido. A linha preta marca a letalidade geral.`
          : undefined
      }
      status={toCardStatus(slice, (current) =>
        current.buckets.every((bucket) => bucket.cases === 0),
      )}
      refreshing={isRefreshing(slice)}
    >
      {data && (
        <>
          {headline && (
            <p className="mb-5 text-base font-medium text-black dark:text-white">{headline}</p>
          )}
          <ul className="space-y-4">
            {data.buckets.map((bucket) => {
              const tone = lethalityTone(bucket.lethality, data.baseline);
              return (
                <ClinicalRow
                  key={bucket.key}
                  label={bucket.label}
                  caption={casesCaption(bucket.cases, bucket.pct)}
                  trailing={
                    <strong className="text-base text-black dark:text-white">
                      {formatLethality(bucket.lethality)}
                      {!bucket.reliable && bucket.lethality !== null ? '*' : ''}
                    </strong>
                  }
                >
                  <Meter
                    width={barWidth(bucket.lethality, scale)}
                    color={TONE_COLORS[tone]}
                    marker={marker}
                    muted={!bucket.reliable}
                    ariaLabel={`${bucket.label}: letalidade ${formatLethality(bucket.lethality)}`}
                  />
                </ClinicalRow>
              );
            })}
          </ul>
          <ToneLegend baseline={data.baseline} />
          <ReliabilityNote />
        </>
      )}
    </ChartCard>
  );
}
