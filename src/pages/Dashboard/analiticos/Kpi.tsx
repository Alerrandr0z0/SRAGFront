import type { ReactNode } from 'react';

export const formatCount = (value: number) => value.toLocaleString('pt-BR');

export const formatDays = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '—';
  return `${String(value).replace('.', ',')} ${value === 1 ? 'dia' : 'dias'}`;
};

interface KpiProps {
  label: string;
  value: ReactNode;
  detail: ReactNode;
}

/** Indicador grande com legenda: o número que o gráfico abaixo explica. */
export default function Kpi({ label, value, detail }: KpiProps) {
  return (
    <div className="rounded border border-stroke px-4 py-3 dark:border-strokedark">
      <p className="text-xs text-body dark:text-bodydark">{label}</p>
      <p className="mt-1 flex items-center gap-2 text-2xl font-semibold text-black dark:text-white">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-body dark:text-bodydark">{detail}</p>
    </div>
  );
}
