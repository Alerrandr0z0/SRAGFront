import { useMemo } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import { buildImagingOption } from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import { getImagingSeverity, type ImagingGroup } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchImaging = (filters: SragFilters) => getImagingSeverity(filters);

function ImagingPanel({
  title,
  group,
  minCases,
}: {
  title: string;
  group: ImagingGroup;
  minCases: number;
}) {
  const theme = chartTheme(useIsDark());
  const option = useMemo(
    () => (group.rows.length > 0 ? buildImagingOption(group.rows, theme) : null),
    [group.rows, theme],
  );

  return (
    <div>
      <h3 className="mb-2 text-center text-sm font-semibold text-black dark:text-white">{title}</h3>
      {option ? (
        <EChartView
          option={option}
          height={Math.max(180, group.rows.length * 70 + 70)}
          ariaLabel={`${title}: UTI e letalidade por resultado`}
        />
      ) : (
        <p className="py-10 text-center text-sm text-body dark:text-bodydark">
          Nenhum resultado com pelo menos {minCases} casos.
        </p>
      )}
      {group.hidden.length > 0 && (
        <p className="mt-2 text-xs text-body dark:text-bodydark">
          Menos de {minCases} casos, não exibido: {group.hidden.join(', ')}.
        </p>
      )}
    </div>
  );
}

export default function ImagingCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchImaging, filters);
  const data = slice.data;

  return (
    <ChartCard
      title="Imagem e gravidade"
      subtitle="Para cada resultado de exame de imagem: quantos foram para a UTI e quantos morreram."
      help="Azul: proporção dos casos com aquele resultado que foi para a UTI. Vermelho: letalidade, calculada entre os casos com desfecho conhecido. Passe o mouse para ver os números absolutos. Resultados mais graves tendem a aparecer em pacientes que já estavam mais doentes, então a imagem mostra gravidade, não causa."
      status={toCardStatus(
        slice,
        (current) =>
          current.xray.rows.length +
            current.ct.rows.length +
            current.xray.hidden.length +
            current.ct.hidden.length ===
          0,
      )}
      refreshing={isRefreshing(slice)}
    >
      {data && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ImagingPanel title="Raio-X de tórax" group={data.xray} minCases={data.min_cases} />
          <ImagingPanel title="Tomografia" group={data.ct} minCases={data.min_cases} />
        </div>
      )}
    </ChartCard>
  );
}
