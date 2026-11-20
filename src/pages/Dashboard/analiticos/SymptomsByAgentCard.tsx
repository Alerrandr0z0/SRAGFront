import { useState } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import {
  AGENT_COLORS,
  agentsWithCases,
  buildSymptomsByAgentOption,
} from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import { getSymptomsByAgent, type SymptomProfile } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchSymptoms = (filters: SragFilters, profile: string) =>
  getSymptomsByAgent(filters, profile as SymptomProfile);

const PROFILES: { value: SymptomProfile; label: string }[] = [
  { value: 'all', label: 'Todas as faixas' },
  { value: 'crianca', label: 'Criança' },
  { value: 'adolescente', label: 'Adolescente' },
  { value: 'adulto', label: 'Adulto' },
  { value: 'idoso', label: 'Idoso' },
];

const SYMPTOMS_SHOWN = 8;
const ROW_HEIGHT_PER_AGENT = 15;

export default function SymptomsByAgentCard({ filters }: { filters: SragFilters }) {
  const [profile, setProfile] = useState<SymptomProfile>('all');
  const slice = useAnalyticsData(fetchSymptoms, filters, profile);
  const theme = chartTheme(useIsDark());
  const data = slice.data;
  const agents = data ? agentsWithCases(data) : [];
  const shown = data ? Math.min(SYMPTOMS_SHOWN, data.symptoms.length) : 0;
  const height = shown * (agents.length * ROW_HEIGHT_PER_AGENT + 16) + 70;

  return (
    <ChartCard
      title="Sintomas: o que diferencia cada agente"
      subtitle="Quais sintomas mais marcam COVID-19, Influenza e VSR: % dos casos de cada agente com o sintoma."
      help="Cada caso entra em um único agente (o mesmo critério do filtro de agente: VSR por RT-PCR ou antígeno tem prioridade sobre a classificação final). O destaque de cada agente é o sintoma em que ele mais supera os outros, com pelo menos 10 pontos de diferença."
      status={toCardStatus(slice, (current) => agentsWithCases(current).length === 0)}
      refreshing={isRefreshing(slice)}
      actions={
        <select
          aria-label="Faixa etária"
          value={profile}
          onChange={(event) => setProfile(event.target.value as SymptomProfile)}
          className="rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
        >
          {PROFILES.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="text-body dark:text-bodydark"
            >
              {option.label}
            </option>
          ))}
        </select>
      }
    >
      {data && (
        <>
          <ul className="mb-5 grid gap-3 md:grid-cols-3">
            {agents.map((agent) => (
              <li
                key={agent.key}
                className="rounded border border-stroke border-l-4 px-4 py-3 dark:border-strokedark"
                style={{ borderLeftColor: AGENT_COLORS[agent.label] }}
              >
                <p className="text-xs text-body dark:text-bodydark">
                  {agent.label} · {agent.cases.toLocaleString('pt-BR')} casos
                </p>
                {agent.distinctive ? (
                  <p className="mt-1 text-sm text-black dark:text-white">
                    Mais característico: <strong>{agent.distinctive.symptom}</strong> em{' '}
                    {agent.distinctive.pct.toLocaleString('pt-BR')}% dos casos,{' '}
                    {agent.distinctive.gap.toLocaleString('pt-BR')} pontos acima dos outros agentes.
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-body dark:text-bodydark">
                    Nenhum sintoma se destaca claramente dos outros agentes.
                  </p>
                )}
              </li>
            ))}
          </ul>
          <EChartView
            option={buildSymptomsByAgentOption(data, theme, SYMPTOMS_SHOWN)}
            height={height}
            ariaLabel="Sintomas mais frequentes por agente etiológico"
          />
          <p className="mt-2 text-xs text-body dark:text-bodydark">
            Os {shown} sintomas mais frequentes. Passe o mouse (ou toque) na barra para ver a
            contagem.
          </p>
        </>
      )}
    </ChartCard>
  );
}
