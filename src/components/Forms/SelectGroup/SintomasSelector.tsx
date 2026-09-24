import type React from 'react';
import { useEffect, useRef, useState } from 'react';

interface SintomasSelectorProps {
  sintomasSelected: string[];
  setSintomasSelected: (value: string[]) => void;
}

// Filtro "Sintomatologia" (multi-seleção, regra AND entre os selecionados —
// um caso só entra se tiver TODOS os sintomas marcados, código 1 = Sim).
// Chave curta -> rótulo em PT-BR. A chave é o que vai em `?sintomas=`.
const SINTOMAS = [
  { value: 'febre', label: 'Febre' },
  { value: 'tosse', label: 'Tosse' },
  { value: 'garganta', label: 'Dor de garganta' },
  { value: 'dispneia', label: 'Dispneia' },
  { value: 'desc_resp', label: 'Desconforto respiratório' },
  { value: 'saturacao', label: 'Saturação O2 < 95%' },
  { value: 'diarreia', label: 'Diarreia' },
  { value: 'vomito', label: 'Vômito' },
  { value: 'dor_abd', label: 'Dor abdominal' },
  { value: 'fadiga', label: 'Fadiga' },
  { value: 'perd_olft', label: 'Perda de olfato' },
  { value: 'perd_pala', label: 'Perda de paladar' },
  { value: 'outro_sin', label: 'Outro sintoma' },
];

const SintomasSelector: React.FC<SintomasSelectorProps> = ({
  sintomasSelected,
  setSintomasSelected,
}) => {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dropdown = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      const node = target as Node | null;
      if (!dropdown.current || !trigger.current) return;
      if (!open || dropdown.current.contains(node) || trigger.current.contains(node)) return;
      setOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  }, [open]);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (!open || e.key !== 'Escape') return;
      setOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  }, [open]);

  const toggle = (value: string) => {
    if (sintomasSelected.includes(value)) {
      setSintomasSelected(sintomasSelected.filter((s) => s !== value));
    } else {
      setSintomasSelected([...sintomasSelected, value]);
    }
  };

  const label =
    sintomasSelected.length === 0
      ? 'Sintomatologia'
      : sintomasSelected.length === 1
        ? (SINTOMAS.find((s) => s.value === sintomasSelected[0])?.label ?? 'Sintomatologia')
        : `${sintomasSelected.length} sintomas selecionados`;

  return (
    <div className="mb-4.5 relative">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`relative z-20 w-full min-w-[220px] appearance-none rounded border border-stroke bg-transparent py-3 px-5 text-left outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary mr-4 ${
          sintomasSelected.length > 0 ? 'text-black dark:text-white' : ''
        }`}
      >
        {label}
      </button>

      {open && (
        <div
          ref={dropdown}
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto rounded border border-stroke bg-white p-2 shadow-default dark:border-strokedark dark:bg-boxdark"
        >
          {sintomasSelected.length > 0 && (
            <button
              type="button"
              onClick={() => setSintomasSelected([])}
              className="mb-1 w-full rounded px-2 py-1 text-left text-xs text-primary hover:bg-gray-2 dark:hover:bg-meta-4"
            >
              Limpar seleção
            </button>
          )}
          {SINTOMAS.map((s) => (
            <label
              key={s.value}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-black hover:bg-gray-2 dark:text-white dark:hover:bg-meta-4"
            >
              <input
                type="checkbox"
                checked={sintomasSelected.includes(s.value)}
                onChange={() => toggle(s.value)}
                className="h-4 w-4 accent-primary"
              />
              {s.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default SintomasSelector;
