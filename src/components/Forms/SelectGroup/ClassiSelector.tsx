import type React from 'react';
import { useState } from 'react';

interface ClassiSelectorProps {
  classiSelected: string;
  setClassiSelected: (value: string) => void;
}

// Classificação final SRAG (CLASSI_FIN SIVEP). Valor vai direto para `?classi=` do Back.
const CLASSIS = [
  { value: '', label: 'Todas as classificações' },
  { value: '1', label: 'Influenza' },
  { value: '2', label: 'Outro vírus' },
  { value: '3', label: 'Outro agente' },
  { value: '4', label: 'Não especificado' },
  { value: '5', label: 'Covid-19' },
];

const ClassiSelector: React.FC<ClassiSelectorProps> = ({ classiSelected, setClassiSelected }) => {
  const [touched, setTouched] = useState<boolean>(false);

  return (
    <div className="mb-4.5">
      <div className="relative z-20 bg-transparent dark:bg-form-input">
        <select
          value={classiSelected}
          onChange={(e) => {
            setClassiSelected(e.target.value);
            setTouched(true);
          }}
          className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary mr-4 ${
            touched ? 'text-black dark:text-white' : ''
          }`}
        >
          {CLASSIS.map((c) => (
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
