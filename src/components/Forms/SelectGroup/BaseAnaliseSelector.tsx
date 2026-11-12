import type React from 'react';
import { useState } from 'react';
import HelpTooltip from './HelpTooltip';

interface BaseAnaliseSelectorProps {
  baseSelected: string;
  setBaseSelected: (value: string) => void;
}

// Filtro "Base de análise": troca o universo de linhas usado por TODOS os
// cards/gráficos/mapa das duas páginas (Vigilância e Sociodemográfico).
// - todos (default, vazio): universo completo (notificados, confirmados e óbitos),
//   sem filtro extra. O Back trata '' e 'notificados' do mesmo jeito.
// - confirmados: CLASSI_FIN ∈ {1, 5} — classificação final etiológica
//   (Influenza ou COVID-19). Importante: NÃO é confirmação laboratorial
//   isolada, por isso o rótulo deixa isso explícito.
// - obitos: EVOLUCAO == 2.
const BASES = [
  { value: '', label: 'Todos os casos' },
  { value: 'confirmados', label: 'Confirmados (classificação final)' },
  { value: 'obitos', label: 'Óbitos' },
];

const BaseAnaliseSelector: React.FC<BaseAnaliseSelectorProps> = ({
  baseSelected,
  setBaseSelected,
}) => {
  const [touched, setTouched] = useState<boolean>(false);

  return (
    <div>
      <div className="relative z-40 bg-transparent dark:bg-form-input">
        <select
          value={baseSelected}
          onChange={(e) => {
            setBaseSelected(e.target.value);
            setTouched(true);
          }}
          className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-2.5 pl-3 pr-9 text-sm outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary ${
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
          <HelpTooltip text='"Todos os casos" reúne notificados, confirmados e óbitos. "Confirmados" usa a classificação final etiológica (CLASSI_FIN), não confirmação laboratorial isolada.' />
        </span>
      </div>
    </div>
  );
};

export default BaseAnaliseSelector;
