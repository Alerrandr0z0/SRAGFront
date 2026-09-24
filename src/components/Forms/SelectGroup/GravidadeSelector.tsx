import type React from 'react';
import { useState } from 'react';

interface GravidadeSelectorProps {
  gravidadeSelected: string;
  setGravidadeSelected: (value: string) => void;
}

// Filtro "Gravidade" (select único). Cada opção é independente — não há
// lógica de exclusão entre elas nos dados (ex.: um caso pode ter passado
// por UTI e por internação comum, sem contradição).
// - todos (default, vazio): sem filtro extra.
// - uti: UTI == 1 (Sim).
// - internacao: HOSPITAL == 1 (Sim, "Houve internação?").
// - ventilacao: SUPORT_VEN ∈ {1, 2} — invasivo ou não invasivo.
// Em qualquer opção específica, casos sem o campo preenchido ficam de fora.
const GRAVIDADES = [
  { value: '', label: 'Todos' },
  { value: 'uti', label: 'UTI' },
  { value: 'internacao', label: 'Internação' },
  { value: 'ventilacao', label: 'Ventilação' },
];

const GravidadeSelector: React.FC<GravidadeSelectorProps> = ({
  gravidadeSelected,
  setGravidadeSelected,
}) => {
  const [touched, setTouched] = useState<boolean>(false);

  return (
    <div className="mb-4.5">
      <div className="relative z-20 bg-transparent dark:bg-form-input">
        <select
          value={gravidadeSelected}
          onChange={(e) => {
            setGravidadeSelected(e.target.value);
            setTouched(true);
          }}
          className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary mr-4 ${
            touched ? 'text-black dark:text-white' : ''
          }`}
        >
          {GRAVIDADES.map((g) => (
            <option key={g.value} value={g.value} className="text-body dark:text-bodydark">
              {g.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default GravidadeSelector;
