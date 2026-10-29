import { useMemo } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import { buildSeverityLethalityOption } from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import { getLethalityByAgeAgent, getSeverityByAge } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

// Fora do componente: a referência não muda entre renders, então o hook só busca de novo
// quando os filtros mudam.
const fetchSeverity = (filters: SragFilters) => getSeverityByAge(filters);
const fetchLethality = (filters: SragFilters) => getLethalityByAgeAgent(filters);

const CHART_HEIGHT = 340;

const HELP =
  'Barras empilhadas (eixo esquerdo): total de casos na faixa, dividido em óbito, UTI em ' +
  'sobreviventes e enfermaria/não internado. Linhas (eixo direito): letalidade (CFR %) de cada ' +
  'agente na faixa; células com poucos casos ficam sem ponto. As barras mostram a carga de ' +
  'casos; as linhas mostram o risco relativo por idade.';

export default function SeverityLethalityAgeCard({ filters }: { filters: SragFilters }) {
  const severity = useAnalyticsData(fetchSeverity, filters);
  const lethality = useAnalyticsData(fetchLethality, filters);

  const isDark = useIsDark();
  // useMemo: sem ele o tema seria um objeto novo a cada render e o option seria refeito à toa.
  const theme = useMemo(() => chartTheme(isDark), [isDark]);

  const option = useMemo(
    () =>
      severity.data?.length
        ? buildSeverityLethalityOption(severity.data, lethality.data, theme)
        : null,
    [severity.data, lethality.data, theme],
  );

  // As barras mandam no estado do card. Na primeira carga espera-se também a letalidade, senão
  // o gráfico apareceria sem as linhas e depois "pularia". Se a letalidade falhar, o gráfico
  // aparece só com as barras.
  const barsStatus = toCardStatus(severity, (rows) => rows.length === 0);
  const waitingLethality = lethality.data === null && lethality.status === 'loading';
  const status = barsStatus === 'ready' && waitingLethality ? 'loading' : barsStatus;

  return (
    <ChartCard
      title="Gravidade e Letalidade (CFR) por Faixa Etária"
      subtitle="Volume de casos por gravidade e letalidade por agente, segundo a faixa etária."
      help={HELP}
      status={status}
      refreshing={isRefreshing(severity) || isRefreshing(lethality)}
    >
      <EChartView
        option={option}
        height={CHART_HEIGHT}
        ariaLabel="Gravidade e letalidade por faixa etária"
      />
    </ChartCard>
  );
}