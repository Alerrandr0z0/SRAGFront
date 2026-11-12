import { useMemo } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import { buildLethalityPanels } from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import { getLethalityByAgeAgent } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchLethality = (filters: SragFilters) => getLethalityByAgeAgent(filters);

const PANEL_HEIGHT = 260;

const HELP =
  'Gráfico de barras (eixo único): letalidade (CFR %) de cada agente ' +
  'patogênico de acordo com a faixa etária. Células/faixas com poucos casos ficam sem barra, ' +
  'indicando que não há dados estatísticos suficientes para estimar o risco relativo.';

export default function LethalityAgeCard({ filters }: { filters: SragFilters }) {
  const lethality = useAnalyticsData(fetchLethality, filters);

  const isDark = useIsDark();
  const theme = useMemo(() => chartTheme(isDark), [isDark]);
  const panels = useMemo(() => buildLethalityPanels(lethality.data, theme), [lethality.data, theme]);

  // Como lethality.data é um objeto, verificamos se o array 'agents' está vazio
  const status = toCardStatus(lethality, (data) => !data || data.agents.length === 0);
  return (
    <ChartCard
      title="Letalidade (CFR) por Faixa Etária"
      subtitle="Percentual de letalidade (CFR) por agente, agrupado por faixa etária."
      help={HELP}
      status={status}
      refreshing={isRefreshing(lethality)}
    >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {panels.map(({ agent, color, option }) => (
          <div key={agent}>
            <h3 className="mb-1 flex items-center justify-center gap-2 text-sm font-semibold text-black dark:text-white">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              {agent}
            </h3>
            {option ? (
              <EChartView
                option={option}
                height={PANEL_HEIGHT}
                ariaLabel={`Letalidade por faixa etária — ${agent}`}
              />
            ) : (
              <p
                className="flex items-center justify-center text-xs text-body dark:text-bodydark"
                style={{ height: PANEL_HEIGHT }}
              >
                Sem casos com desfecho
              </p>
            )}
          </div>
        ))}
      </div>
    </ChartCard>
  );
}