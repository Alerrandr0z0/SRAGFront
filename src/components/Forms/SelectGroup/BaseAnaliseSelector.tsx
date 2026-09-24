import type React from 'react';
import { useState } from 'react';
import HelpTooltip from './HelpTooltip';

interface BaseAnaliseSelectorProps {
  baseSelected: string;
  setBaseSelected: (value: string) => void;
}

// Filtro "Base de análise": troca o universo de linhas usado por TODOS os
// cards/gráficos/mapa das duas páginas (Vigilância e Sociodemográfico).
// - notificados (default, vazio): todos os casos, sem filtro extra.
// - confirmados: CLASSI_FIN ∈ {1, 5} — classificação final etiológica
//   (Influenza ou COVID-19). Importante: NÃO é confirmação laboratorial
//   isolada, por isso o rótulo deixa isso explícito.
// - obitos: EVOLUCAO == 2.
const BASES = [
  { value: '', label: 'Notificados' },
  { value: 'confirmados', label: 'Confirmados (classificação final)' },
  { value: 'obitos', label: 'Óbitos' },
];

const BaseAnaliseSelector: React.FC<BaseAnaliseSelectorProps> = ({
  baseSelected,
  setBaseSelected,
}) => {
  const [touched, setTouched] = useState<boolean>(false);

  return (
    <div className="mb-4.5">
      <div className="relative z-40 bg-transparent dark:bg-form-input">
        <select
          value={baseSelected}
          onChange={(e) => {
            setBaseSelected(e.target.value);
            setTouched(true);
          }}
          className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 pl-5 pr-9 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary mr-4 ${
            touched ? 'text-black dark:text-white' : ''
          }`}
        >
          {BASES.map((b) => (
            <option key={b.value} value={b.value} className="text-body dark:text-bodydark">
              {b.label}
            </option>
          ))}
        </select>
        <span className="absolute right-2 top-1/2 z-30 -translate-y-1/2">
          <HelpTooltip text='"Confirmados" usa a classificação final etiológica (CLASSI_FIN), não confirmação laboratorial isolada.' />
        </span>
      </div>
    </div>
  );
};

export default BaseAnaliseSelector;