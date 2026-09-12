import type React from 'react';
import { useState } from 'react';

interface BairroSelectorProps {
  bairroSelected: string;
  setBairroSelected: (value: string) => void;
  bairros: string[];
}

const BairroSelector: React.FC<BairroSelectorProps> = ({
  bairroSelected,
  setBairroSelected,
  bairros = [],
}) => {
  const [isOptionSelected, setIsOptionSelected] = useState<boolean>(false);

  return (
    <div className="mb-4.5">
      <div className="relative bg-transparent dark:bg-form-input">
        <select
          value={bairroSelected}
          onChange={(e) => {
            setBairroSelected(e.target.value);
            setIsOptionSelected(true);
          }}
          className={`relative w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary mr-4 ${
            isOptionSelected ? 'text-black dark:text-white' : ''
          }`}
        >
          <option value="" className="text-body dark:text-bodydark">
            Todos os bairros
          </option>
          {bairros
            .filter((bairro) => bairro !== null)
            .sort((a, b) => a.localeCompare(b))
            .map((bairro) => (
              <option key={bairro} value={bairro} className="text-body dark:text-bodydark">
                {bairro}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};

export default BairroSelector;
