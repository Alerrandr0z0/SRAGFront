import type { ReactNode } from 'react';
import HelpTooltip from '../../Forms/SelectGroup/HelpTooltip';

export type ChartStatus = 'loading' | 'ready' | 'error' | 'empty';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  help?: string;
  status: ChartStatus;
  /** Há dados antigos na tela enquanto uma nova consulta carrega. */
  refreshing?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}

const MESSAGES: Record<Exclude<ChartStatus, 'ready'>, string> = {
  loading: 'Carregando...',
  error: 'Não foi possível carregar este gráfico. Verifique se o backend está no ar.',
  empty: 'Sem dados para os filtros selecionados.',
};

export default function ChartCard({
  title,
  subtitle,
  help,
  status,
  refreshing = false,
  actions,
  children,
}: ChartCardProps) {
  return (
    <section className="col-span-12 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
            {title}
            {help && <HelpTooltip text={help} />}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-body dark:text-bodydark">{subtitle}</p>}
        </div>
        {actions}
      </header>

      {status === 'ready' ? (
        <div className={`transition-opacity duration-300 ${refreshing ? 'opacity-50' : ''}`}>
          {children}
        </div>
      ) : (
        <p className="py-16 text-center text-sm text-body dark:text-bodydark">{MESSAGES[status]}</p>
      )}
    </section>
  );
}
