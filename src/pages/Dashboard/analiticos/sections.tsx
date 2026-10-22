import type { SragFilters } from '../../../service/srag/sragFilters';
import AnimalContactCard from './AnimalContactCard';
import AntiviralCard from './AntiviralCard';
import CovidImmunizationCard from './CovidImmunizationCard';
import DiagnosticLethalityCard from './DiagnosticLethalityCard';
import DiagnosticMethodsCard from './DiagnosticMethodsCard';
import FlowCard from './FlowCard';
import HospitalStayCard from './HospitalStayCard';
import IcuAccessCard from './IcuAccessCard';
import ImagingCard from './ImagingCard';
import LabPerformanceCard from './LabPerformanceCard';
import MaternalOutcomesCard from './MaternalOutcomesCard';
import NosocomialCard from './NosocomialCard';
import NotificationDelayCard from './NotificationDelayCard';
import NotifyingUnitsCard from './NotifyingUnitsCard';
import OccupationCard from './OccupationCard';
import OddsRatioCard from './OddsRatioCard';
import SamplePositivityCard from './SamplePositivityCard';
import type { TabSection } from './SectionTabs';
import SignatureCard from './SignatureCard';
import UnitDelayCard from './UnitDelayCard';
import VaccineJourneyCard from './VaccineJourneyCard';

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
    id: 'territorio',
    label: 'Território',
    description:
      'Em quais bairros as notificações demoram mais. O mapa e a tabela de bairros ficam na página Sociodemográfica.',
  },
  {
    id: 'unidades',
    label: 'Unid. Saúde',
    description:
      'Quais unidades notificam mais, se notificam a tempo, quanto tempo os pacientes ficam internados e como a vacinação aparece na jornada. O caminho do paciente (Sankey) fica na aba Perfil clínico.',
  },
  {
    id: 'clinico',
    label: 'Perfil clínico',
    description: 'O caminho do paciente da internação ao desfecho e como cada agente se manifesta.',
  },
  {
    id: 'cidadao',
    label: 'Cidadão',
    description:
      'Quem adoece e o que o cerca: gestantes, ocupação, contato com animais e vacinação. Idade, raça e escolaridade ficam na página Sociodemográfica.',
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
    case 'territorio':
      return <NotificationDelayCard filters={filters} />;
    case 'unidades':
      return (
        <>
          <NotifyingUnitsCard filters={filters} />
          <UnitDelayCard filters={filters} />
          <HospitalStayCard filters={filters} />
          <VaccineJourneyCard filters={filters} />
        </>
      );
    case 'clinico':
      return (
        <>
          <FlowCard filters={filters} />
          <SignatureCard filters={filters} />
        </>
      );
    case 'cidadao':
      return (
        <>
          <MaternalOutcomesCard filters={filters} />
          <CovidImmunizationCard filters={filters} />
          <OccupationCard filters={filters} />
          <AnimalContactCard filters={filters} />
        </>
      );
  }
}
