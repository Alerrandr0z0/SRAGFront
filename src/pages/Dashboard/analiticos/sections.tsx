import type { SragFilters } from '../../../service/srag/sragFilters';
import AnimalContactCard from './AnimalContactCard';
import AntiviralCard from './AntiviralCard';
import CovidImmunizationCard from './CovidImmunizationCard';
import DiagnosticLethalityCard from './DiagnosticLethalityCard';
import DiagnosticMethodsCard from './DiagnosticMethodsCard';
import HospitalStayCard from './HospitalStayCard';
import IcuAccessCard from './IcuAccessCard';
import ImagingCard from './ImagingCard';
import LabPerformanceCard from './LabPerformanceCard';
import MaternalOutcomesCard from './MaternalOutcomesCard';
import NosocomialCard from './NosocomialCard';
import NotificationDelayCard from './NotificationDelayCard';
import NotifyingUnitsCard from './NotifyingUnitsCard';
import OccupationCard from './OccupationCard';
import RiskFactorLoadCard from './RiskFactorLoadCard';
import SamplePositivityCard from './SamplePositivityCard';
import type { TabSection } from './SectionTabs';
import SeverityCascadeCard from './SeverityCascadeCard';
import SeverityLethalityAgeCard from './SeverityAgeCard';
import LethalityAgeCard from './LethalityAgeCard';
import SymptomsByAgentCard from './SymptomsByAgentCard';
import UnitDelayCard from './UnitDelayCard';
import VaccineJourneyCard from './VaccineJourneyCard';
import WarningSignsCard from './WarningSignsCard';

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
      'Quais unidades notificam mais, se notificam a tempo, quanto tempo os pacientes ficam internados e como a vacinação aparece na jornada. A gravidade dos casos fica na aba Perfil clínico.',
  },
  {
    id: 'clinico',
    label: 'Perfil clínico',
    description:
      'Quão grave é o quadro: quantos casos internam e vão à UTI, quais sinais e fatores de risco aumentam a letalidade e o que diferencia cada agente.',
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
          <SeverityLethalityAgeCard filters={filters} />
          <LethalityAgeCard filters={filters} />
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
          <SeverityCascadeCard filters={filters} />
          <WarningSignsCard filters={filters} />
          <RiskFactorLoadCard filters={filters} />
          <SymptomsByAgentCard filters={filters} />
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
