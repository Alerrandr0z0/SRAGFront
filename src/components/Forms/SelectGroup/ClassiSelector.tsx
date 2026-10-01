import type React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';

interface ClassiSelectorProps {
  agentSelected: string; 
  classiSelected: string;
  setClassiSelected: (value: string) => void;
}

const CLASSIS = [
  { value: '1', label: 'Todas as classificações', agenteId: '1' },
  { value: '2', label: 'Tipo A', agenteId: '1' },
  { value: '3', label: 'Tipo B', agenteId: '1' },
  { value: '4', label: 'Tipo A - H1N1', agenteId: '1' },
  { value: '5', label: 'Tipo A - H3N2 pdm09', agenteId: '1' },
  { value: '6', label: 'Tipo A - Não subtipado', agenteId: '1' },
  { value: '7', label: 'Tipo A - Não subtipável', agenteId: '1' },
  { value: '8', label: 'Tipo B - Victoria', agenteId: '1' },
  { value: '9', label: 'Tipo B - Yamagata', agenteId: '1' },
  { value: '10', label: 'Influenza não tipada', agenteId: '1' },
  { value: '11', label: 'Não se aplica', agenteId: 'todos' },
];

const ClassiSelector: React.FC<ClassiSelectorProps> = ({
  agentSelected,
  classiSelected,
  setClassiSelected,
}) => {
  const [touched, setTouched] = useState<boolean>(false);
  const isInfluenza = agentSelected === '1' || agentSelected?.toUpperCase() === 'INFLUENZA';

  const classisFiltradas = CLASSIS.filter((c) =>
    isInfluenza ? c.value !== '11' : c.value === '11'
  );

  useEffect(() => {
    if (!isInfluenza && classiSelected !== '11') {
      setClassiSelected('11'); 
    } else if (isInfluenza && classiSelected === '11') {
      setClassiSelected('1'); 
    }
  }, [agentSelected, isInfluenza, classiSelected, setClassiSelected]);

  return (
    <div className="mb-4.5">
      <div className="relative z-20 bg-transparent dark:bg-form-input">
        <select
          value={classiSelected}
          disabled={!isInfluenza} 
          onChange={(e) => {
            setClassiSelected(e.target.value);
            setTouched(true);
          }}
          className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary mr-4 ${
            touched ? 'text-black dark:text-white' : ''
          } ${!isInfluenza ? 'cursor-not-allowed opacity-75' : ''}`}
        >
          {classisFiltradas.map((c) => (
            <option key={c.value} value={c.value} className="text-body dark:text-bodydark">
              {c.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ClassiSelector;