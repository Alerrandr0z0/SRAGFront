import type React from 'react';
import { useState } from 'react';

interface AgentSelectorProps {
  agentSelected: string;
  setAgentSelected: (value: string) => void;
}

// Agentes etiológicos SRAG (SIVEP). Valor vai direto para `?agents=` do Back.
const AGENTS = [
  { value: '', label: 'Todos os agentes' },
  { value: 'INFLUENZA', label: 'Influenza' },
  { value: 'COVID-19', label: 'Covid-19' },
  { value: 'VSR', label: 'VSR' },
  { value: 'OUTRO_VIRUS', label: 'Outro vírus' },
  { value: 'NAO_ESPECIFICADO', label: 'Não especificado' },
];

const AgentSelector: React.FC<AgentSelectorProps> = ({ agentSelected, setAgentSelected }) => {
  const [touched, setTouched] = useState<boolean>(false);

  return (
    <div className="mb-4.5">
      <div className="relative z-20 bg-transparent dark:bg-form-input">
        <select
          value={agentSelected}
          onChange={(e) => {
            setAgentSelected(e.target.value);
            setTouched(true);
          }}
          className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary mr-4 ${
            touched ? 'text-black dark:text-white' : ''
          }`}
        >
          {AGENTS.map((a) => (
            <option key={a.value} value={a.value} className="text-body dark:text-bodydark">
              {a.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AgentSelector;
