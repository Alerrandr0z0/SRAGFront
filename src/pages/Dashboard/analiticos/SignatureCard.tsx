import { useState } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import { buildHeatmapOption } from '../../../components/Charts/Analytics/chartOptions';
import { chartTheme } from '../../../components/Charts/Analytics/chartTheme';
import EChartView from '../../../components/Charts/Analytics/EChartView';
import useIsDark from '../../../hooks/useIsDark';
import {
  getSymptomsSignature,
  type SignatureAgent,
  type SignatureProfile,
} from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';

const fetchSignature = (filters: SragFilters, profile: string) =>
  getSymptomsSignature(filters, profile as SignatureProfile);

const PROFILES: { value: SignatureProfile; label: string }[] = [
  { value: 'all', label: 'Todas as faixas' },
  { value: 'crianca', label: 'Criança' },
  { value: 'adolescente', label: 'Adolescente' },
  { value: 'adulto', label: 'Adulto' },
  { value: 'idoso', label: 'Idoso' },
];

const AGENTS: { key: SignatureAgent; title: string }[] = [
  { key: 'covid', title: 'COVID-19' },
  { key: 'gripe', title: 'Influenza' },
  { key: 'vsr', title: 'VSR' },
];

export default function SignatureCard({ filters }: { filters: SragFilters }) {
  const [profile, setProfile] = useState<SignatureProfile>('all');
  const slice = useAnalyticsData(fetchSignature, filters, profile);
  const theme = chartTheme(useIsDark());
  const data = slice.data;

  return (
    <ChartCard
      title="Assinatura clínica de sintomas"
      subtitle="% de casos com cada sintoma, por agente etiológico e faixa etária."
      help="Cada caso entra em um único agente (o mesmo critério do filtro de agente: VSR por RT-PCR/antígeno tem prioridade sobre a classificação final). Células com '–' não têm casos naquele grupo."
      status={toCardStatus(slice, (current) => current.labels.length === 0)}
      refreshing={isRefreshing(slice)}
      actions={
        <select
          aria-label="Faixa etária"
          value={profile}
          onChange={(event) => setProfile(event.target.value as SignatureProfile)}
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
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {AGENTS.map(({ key, title }, index) => (
            <div key={key}>
              <h3 className="mb-1 text-center text-sm font-semibold text-black dark:text-white">
                {title}
              </h3>
              <EChartView
                option={buildHeatmapOption(
                  data.labels,
                  data.bands,
                  data.matrices[key] ?? [],
                  theme,
                  index === 0,
                )}
                height={data.labels.length * 28 + 60}
                ariaLabel={`Mapa de calor de sintomas — ${title}`}
              />
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
