import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import { getWarningSigns } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import { casesCaption, ClinicalRow, Meter, ReliabilityNote } from './ClinicalBars';
import {
  barWidth,
  formatLethality,
  type LethalityTone,
  lethalityMultiple,
  lethalityTone,
  markerPosition,
  maxOf,
  multipleLabel,
  TONE_COLORS,
  TONE_TEXT,
  warningHeadline,
} from './clinicalProfile';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchSigns = (filters: SragFilters) => getWarningSigns(filters);
const WITHOUT_COLOR = '#94A3B8';

function MeterLine({
  name,
  value,
  width,
  color,
  marker,
  muted,
}: {
  name: string;
  value: number | null;
  width: number;
  color: string;
  marker: number | null;
  muted: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-xs text-body dark:text-bodydark">{name}</span>
      <div className="min-w-0 flex-1">
        <Meter
          width={width}
          color={color}
          marker={marker}
          muted={muted}
          height="h-3.5"
          ariaLabel={`${name}: letalidade ${formatLethality(value)}`}
        />
      </div>
      <strong className="w-14 text-right text-sm text-black dark:text-white">
        {formatLethality(value)}
        {muted && value !== null ? '*' : ''}
      </strong>
    </div>
  );
}

function MultipleBadge({ multiple, tone }: { multiple: number; tone: LethalityTone }) {
  const { value, text } = multipleLabel(multiple);
  return (
    <span className={`text-sm ${TONE_TEXT[tone]}`}>
      {value && <strong className="text-base">{value} </strong>}
      {text}
    </span>
  );
}

export default function WarningSignsCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchSigns, filters);
  const data = slice.data;
  const scale = data
    ? Math.max(maxOf(data.signs.flatMap((sign) => [sign.lethality, sign.lethality_without])), 1)
    : 1;
  const marker = data ? markerPosition(data.baseline, scale) : null;
  const headline = data ? warningHeadline(data) : null;

  return (
    <ChartCard
      title="Sinais de alerta respiratório"
      subtitle="A letalidade é maior em quem chega com o sinal? Compare quem tem e quem não tem cada sinal."
      help="Letalidade = óbitos ÷ casos com desfecho conhecido. A linha preta marca a letalidade geral. O selo à direita mostra quantas vezes a letalidade é maior (×) em quem tem o sinal."
      status={toCardStatus(slice, (current) => current.signs.every((sign) => sign.cases === 0))}
      refreshing={isRefreshing(slice)}
    >
      {data && (
        <>
          {headline && (
            <p className="mb-5 text-base font-medium text-black dark:text-white">{headline}</p>
          )}
          <ul className="space-y-5">
            {data.signs.map((sign) => {
              const multiple = lethalityMultiple(sign.lethality, sign.lethality_without);
              const tone = lethalityTone(sign.lethality, data.baseline);
              return (
                <ClinicalRow
                  key={sign.key}
                  label={sign.label}
                  caption={casesCaption(sign.cases)}
                  trailing={
                    multiple !== null && sign.reliable && sign.reliable_without ? (
                      <MultipleBadge multiple={multiple} tone={tone} />
                    ) : (
                      <span className="text-xs text-body dark:text-bodydark">
                        poucos casos para comparar
                      </span>
                    )
                  }
                >
                  <MeterLine
                    name="Com"
                    value={sign.lethality}
                    width={barWidth(sign.lethality, scale)}
                    color={TONE_COLORS[tone]}
                    marker={marker}
                    muted={!sign.reliable}
                  />
                  <MeterLine
                    name="Sem"
                    value={sign.lethality_without}
                    width={barWidth(sign.lethality_without, scale)}
                    color={WITHOUT_COLOR}
                    marker={marker}
                    muted={!sign.reliable_without}
                  />
                </ClinicalRow>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-body dark:text-bodydark">
            <span className="font-bold text-black dark:text-white">│</span> Letalidade geral:{' '}
            {formatLethality(data.baseline)}
          </p>
          <ReliabilityNote />
        </>
      )}
    </ChartCard>
  );
}
