import type { IcuGranularity } from '../../../service/srag/sragAnalytics';

const GRANULARITIES: { value: IcuGranularity; label: string }[] = [
  { value: 'year', label: 'Ano' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'month', label: 'Mês' },
];

interface GranularityToggleProps {
  value: IcuGranularity;
  onChange: (value: IcuGranularity) => void;
}

export default function GranularityToggle({ value, onChange }: GranularityToggleProps) {
  return (
    <fieldset className="inline-flex overflow-hidden rounded border border-stroke text-sm dark:border-strokedark">
      <legend className="sr-only">Agrupar por</legend>
      {GRANULARITIES.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 transition ${
            value === option.value
              ? 'bg-primary text-white'
              : 'text-black hover:bg-gray-2 dark:text-white dark:hover:bg-meta-4'
          }`}
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}
