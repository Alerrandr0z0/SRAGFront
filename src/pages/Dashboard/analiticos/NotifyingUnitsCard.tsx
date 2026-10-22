import { useMemo, useState } from 'react';
import ChartCard from '../../../components/Charts/Analytics/ChartCard';
import { formatPercent, percentOf } from '../../../components/Charts/Analytics/chartOptions';
import { getNotifyingUnits, type NotifyingUnit } from '../../../service/srag/sragAnalytics';
import type { SragFilters } from '../../../service/srag/sragFilters';
import Kpi, { formatCount } from './Kpi';
import useAnalyticsData, { isRefreshing, toCardStatus } from './useAnalyticsData';
import {
  filterUnits,
  paginate,
  type SortDirection,
  sortUnits,
  type UnitSortKey,
} from './unitsTable';

const fetchUnits = (filters: SragFilters) => getNotifyingUnits(filters);

const PAGE_SIZES = [10, 25, 50] as const;

const COLUMNS: { key: UnitSortKey; label: string; numeric: boolean }[] = [
  { key: 'name', label: 'Unidade', numeric: false },
  { key: 'total', label: 'Notificados', numeric: true },
  { key: 'cure', label: 'Curados', numeric: true },
  { key: 'death', label: 'Óbitos', numeric: true },
  { key: 'other', label: 'Outro', numeric: true },
];

/** Barra de 100%: de que lado cada unidade fecha os seus casos. */
function OutcomeBar({ unit }: { unit: NotifyingUnit }) {
  const parts = [
    { label: 'Curados', count: unit.cure, className: 'bg-[#10B981]' },
    { label: 'Óbitos', count: unit.death, className: 'bg-[#DC2626]' },
    { label: 'Outro', count: unit.other, className: 'bg-[#94A3B8]' },
  ];
  const summary = parts
    .map((part) => `${part.label}: ${formatPercent(percentOf(part.count, unit.total))}`)
    .join(' · ');
  return (
    <div
      role="img"
      aria-label={summary}
      title={summary}
      className="flex h-3 w-full min-w-[120px] overflow-hidden rounded-full bg-gray-2 dark:bg-meta-4"
    >
      {parts.map((part) => (
        <div
          key={part.label}
          className={part.className}
          style={{ width: `${percentOf(part.count, unit.total)}%` }}
        />
      ))}
    </div>
  );
}

export default function NotifyingUnitsCard({ filters }: { filters: SragFilters }) {
  const slice = useAnalyticsData(fetchUnits, filters);
  const data = slice.data;
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<UnitSortKey>('total');
  const [direction, setDirection] = useState<SortDirection>('desc');
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [page, setPage] = useState(0);

  const sorted = useMemo(
    () => (data ? sortUnits(filterUnits(data.items, query), sortKey, direction) : []),
    [data, query, sortKey, direction],
  );
  const view = paginate(sorted, page, pageSize);
  const top = data?.items[0];

  const toggleSort = (key: UnitSortKey) => {
    if (key === sortKey) {
      setDirection((current) => (current === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setDirection(key === 'name' ? 'asc' : 'desc');
    }
    setPage(0);
  };

  return (
    <ChartCard
      title="Unidades notificadoras"
      subtitle="Quais unidades de saúde notificam mais casos e como esses casos terminam."
      help="Cada linha é uma unidade que notificou casos de SRAG (código CNES). Curados e óbitos seguem o campo de evolução da ficha; 'Outro' reúne casos em aberto, óbito por outras causas e evolução ignorada. A barra mostra a proporção de cada desfecho dentro da unidade. Uma unidade que recebe os casos mais graves, como um hospital de referência, tende a ter mais óbitos sem que isso diga algo sobre a qualidade do atendimento."
      status={toCardStatus(slice, (current) => current.items.length === 0)}
      refreshing={isRefreshing(slice)}
    >
      {data && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Kpi
              label="Unidades que notificaram"
              value={formatCount(data.items.length)}
              detail={`${formatCount(data.total)} casos no total`}
            />
            <Kpi
              label="Unidade que mais notificou"
              value={<span className="text-base leading-tight">{top?.name ?? '—'}</span>}
              detail={
                top
                  ? `${formatCount(top.total)} casos (${formatPercent(percentOf(top.total, data.total))} do total)`
                  : 'sem unidade informada'
              }
            />
            <Kpi
              label="Casos sem unidade informada"
              value={formatCount(data.unidentified)}
              detail={`${formatPercent(percentOf(data.unidentified, data.total))} dos casos`}
            />
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
              placeholder="Buscar unidade..."
              aria-label="Buscar unidade notificadora"
              className="w-full max-w-xs rounded border border-stroke bg-transparent px-3 py-1.5 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
            />
            <label className="flex items-center gap-2 text-sm text-body dark:text-bodydark">
              Linhas
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(0);
                }}
                className="rounded border border-stroke bg-transparent px-2 py-1 text-sm text-black dark:border-strokedark dark:bg-boxdark dark:text-white"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stroke text-xs uppercase text-body dark:border-strokedark dark:text-bodydark">
                  {COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={
                        column.key === sortKey
                          ? direction === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className={`px-3 py-2 ${column.numeric ? 'text-right' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="font-medium uppercase hover:text-black dark:hover:text-white"
                      >
                        {column.label}
                        {column.key === sortKey ? (direction === 'asc' ? ' ↑' : ' ↓') : ''}
                      </button>
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-2 font-medium">
                    Desfecho
                  </th>
                </tr>
              </thead>
              <tbody>
                {view.rows.map((unit) => (
                  <tr
                    key={unit.id_unidade}
                    className="border-b border-stroke last:border-0 dark:border-strokedark"
                  >
                    <td className="px-3 py-2 text-black dark:text-white">{unit.name}</td>
                    <td className="px-3 py-2 text-right font-medium text-black dark:text-white">
                      {formatCount(unit.total)}
                    </td>
                    <td className="px-3 py-2 text-right">{formatCount(unit.cure)}</td>
                    <td className="px-3 py-2 text-right">{formatCount(unit.death)}</td>
                    <td className="px-3 py-2 text-right">{formatCount(unit.other)}</td>
                    <td className="px-3 py-2">
                      <OutcomeBar unit={unit} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {view.rows.length === 0 && (
              <p className="py-8 text-center text-sm text-body dark:text-bodydark">
                Nenhuma unidade encontrada para "{query}".
              </p>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-body dark:text-bodydark">
            <span>
              Mostrando {view.from}–{view.to} de {formatCount(sorted.length)}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={view.page === 0}
                onClick={() => setPage(view.page - 1)}
                className="rounded border border-stroke px-3 py-1 transition enabled:hover:bg-gray-2 disabled:opacity-40 dark:border-strokedark dark:enabled:hover:bg-meta-4"
              >
                Anterior
              </button>
              <span>
                Página {view.page + 1} de {view.pages}
              </span>
              <button
                type="button"
                disabled={view.page >= view.pages - 1}
                onClick={() => setPage(view.page + 1)}
                className="rounded border border-stroke px-3 py-1 transition enabled:hover:bg-gray-2 disabled:opacity-40 dark:border-strokedark dark:enabled:hover:bg-meta-4"
              >
                Próxima
              </button>
            </div>
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-body dark:text-bodydark">
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#10B981]" />
              Curados
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#DC2626]" />
              Óbitos
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#94A3B8]" />
              Outro ou em aberto
            </span>
          </p>
        </>
      )}
    </ChartCard>
  );
}
