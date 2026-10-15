import type { SragFilters } from '../../../service/srag/sragFilters';
import AntiviralCard from './AntiviralCard';
import DiagnosticLethalityCard from './DiagnosticLethalityCard';
import DiagnosticMethodsCard from './DiagnosticMethodsCard';
import FlowCard from './FlowCard';
import IcuAccessCard from './IcuAccessCard';
import ImagingCard from './ImagingCard';
import LabPerformanceCard from './LabPerformanceCard';
import NosocomialCard from './NosocomialCard';
import OddsRatioCard from './OddsRatioCard';
import SamplePositivityCard from './SamplePositivityCard';
import type { TabSection } from './SectionTabs';
import SignatureCard from './SignatureCard';

export const SECTIONS = [
  {
    id: 'vigilancia',
    label: 'Vigilância',
    description:
      'Como os casos são confirmados, quão letal é a doença e se o serviço de saúde está dando conta.',
  },
  {
    id: 'laboratorio',
    label: 'Laboratório',
    description:
      'Qualidade do diagnóstico, positividade das amostras, rapidez do antiviral e gravidade pela imagem.',
  },
  {
    id: 'clinico',
    label: 'Perfil clínico',
    description: 'O caminho do paciente da internação ao desfecho e como cada agente se manifesta.',
  },
] as const satisfies readonly TabSection<string>[];

export type SectionId = (typeof SECTIONS)[number]['id'];

/** Só a seção aberta é montada, então só ela busca dados no backend. */
export function SectionContent({ id, filters }: { id: SectionId; filters: SragFilters }) {
  switch (id) {
    case 'vigilancia':
      return (
        <>
          <DiagnosticMethodsCard filters={filters} />
          <DiagnosticLethalityCard filters={filters} />
          <NosocomialCard filters={filters} />
          <IcuAccessCard filters={filters} />
          <OddsRatioCard filters={filters} />
        </>
      );
    case 'laboratorio':
      return (
        <>
          <LabPerformanceCard filters={filters} />
          <SamplePositivityCard filters={filters} />
          <AntiviralCard filters={filters} />
          <ImagingCard filters={filters} />
        </>
      );
    case 'clinico':
      return (
        <>
          <FlowCard filters={filters} />
          <SignatureCard filters={filters} />
        </>
      );
  }
}
