import type React from 'react';
import { useState } from 'react';

interface YearSelectorProps {
  yearSelected: string;
  setYearSelected: (value: string) => void;
  minYear?: number;
}

const YearSelector: React.FC<YearSelectorProps> = ({ yearSelected, setYearSelected, minYear }) => {
  const [isOptionSelected, setIsOptionSelected] = useState<boolean>(false);

  const changeTextColor = () => {
    setIsOptionSelected(true);
  };

  const currentYear = new Date().getFullYear();
  const firstYear = minYear ?? currentYear - 10;
  const years = Array.from({ length: currentYear - firstYear + 1 }, (_, i) => currentYear - i);

  return (
    <div className="mb-4.5">
      <div className="relative z-20 bg-transparent dark:bg-form-input">
        <select
          value={yearSelected}
          onChange={(e) => {
            setYearSelected(e.target.value);
            changeTextColor();
          }}
          className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary mr-4 ${
            isOptionSelected ? 'text-black dark:text-white' : ''
          }`}
        >
          <option value="" className="text-body dark:text-bodydark">
            Todos
          </option>
          {years.map((year) => (
            <option key={year} value={year} className="text-body dark:text-bodydark">
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default YearSelector;
