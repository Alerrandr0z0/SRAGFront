import { useEffect, useMemo, useState } from 'react';
import { downloadBairrosPdf } from '../../service/srag/sragClient';
import type { NeighborhoodInfo } from '../../service/srag/sragClient';

interface BaseTableProps {
  neighborhoodData: NeighborhoodInfo[];
  onSelectBairro?: (nomeBairro: string) => void;
  reportQuery?: string;
  showWeekRange?: boolean;
  maxWeek?: number;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

const BaseTable: React.FC<BaseTableProps> = ({
  neighborhoodData,
  onSelectBairro,
  reportQuery = '',
  showWeekRange = true,
  maxWeek = 52,
}) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number | 'all'>(10);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [semanaInicial, setSemanaInicial] = useState(1);
  const [semanaFinal, setSemanaFinal] = useState(maxWeek);

  useEffect(() => {
    setSemanaInicial(1);
    setSemanaFinal(maxWeek);
  }, [maxWeek]);

  async function handleDownloadPdf() {
    if (generatingPdf) return;
    setGeneratingPdf(true);
    try {
      const params = new URLSearchParams(reportQuery);
      if (showWeekRange) {
        const si = Math.min(maxWeek, Math.max(1, Math.floor(semanaInicial) || 1));
        const sf = Math.min(maxWeek, Math.max(1, Math.floor(semanaFinal) || maxWeek));
        setSemanaInicial(si);
        setSemanaFinal(sf);
        if (si > sf) return;
        params.set('semana_inicial', String(si));
        params.set('semana_final', String(sf));
      }
      await downloadBairrosPdf(params.toString());
    } finally {
      setGeneratingPdf(false);
    }
  }

  const rows = useMemo(
    () => (Array.isArray(neighborhoodData) ? neighborhoodData : []),
    [neighborhoodData],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset page when data changes
  useEffect(() => {
    setPage(0);
  }, [rows]);

  const totalPages =
    pageSize === 'all' || rows.length === 0 ? 1 : Math.ceil(rows.length / pageSize);
  const safePage = Math.min(page, totalPages - 1);
  const visibleRows =
    pageSize === 'all' ? rows : rows.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const from = rows.length === 0 ? 0 : pageSize === 'all' ? 1 : safePage * (pageSize as number) + 1;
  const to =
    pageSize === 'all' ? rows.length : Math.min(rows.length, (safePage + 1) * (pageSize as number));

  const irParaDashboardBairro = (nameBairro: string) => {
    if (onSelectBairro) onSelectBairro(nameBairro);
  };

  // Validação de dados
  if (!rows || !Array.isArray(rows)) {
    return (
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <p className="text-center py-4 text-black dark:text-white">Nenhum dado disponível</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <p className="text-center py-4 text-black dark:text-white">Nenhum bairro encontrado</p>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h4 className="text-xl font-semibold text-black dark:text-white">Casos por bairro</h4>
        <div className="flex flex-wrap items-end gap-2">
          {showWeekRange && (
            <>
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-bodydark2">
                Semana inicial
                <input
                  type="number"
                  min={1}
                  max={maxWeek}
                  value={semanaInicial}
                  onChange={(e) => setSemanaInicial(Number(e.target.value))}
                  className="w-20 rounded border border-stroke bg-transparent px-2 py-1.5 text-sm text-black outline-none dark:border-strokedark dark:text-white"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-bodydark2">
                Semana final
                <input
                  type="number"
                  min={1}
                  max={maxWeek}
                  value={semanaFinal}
                  onChange={(e) => setSemanaFinal(Number(e.target.value))}
                  className="w-20 rounded border border-stroke bg-transparent px-2 py-1.5 text-sm text-black outline-none dark:border-strokedark dark:text-white"
                />
              </label>
            </>
          )}
          <button type="button"
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
            title="Baixar relatório PDF por bairro e semana epidemiológica"
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
          >
            {generatingPdf ? 'Gerando…' : 'Baixar relatório PDF'}
          </button>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                Bairros
              </th>
              <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                Notificados
              </th>
              <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                Curados
              </th>
              <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                Obitos
              </th>
              <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                Ignorados
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((neighborhoodItem, key) => (
              <tr key={neighborhoodItem.nomeBairro ?? `row-${key}`}>
                <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                  <button
                    type="button"
                    onClick={() =>
                      irParaDashboardBairro(neighborhoodItem.nomeBairro || 'Desconhecido')
                    }
                    className="font-medium text-primary hover:underline hover:cursor-pointer dark:text-primarydark"
                  >
                    {neighborhoodItem.nomeBairro || 'Não informado'}
                  </button>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">
                    {neighborhoodItem.casosReportados ?? 0}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">{neighborhoodItem.curados ?? 0}</p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">{neighborhoodItem.obitos ?? 0}</p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">{neighborhoodItem.ignorados ?? 0}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <p className="text-sm text-gray-500 dark:text-bodydark2">
          Mostrando {from}–{to} de {rows.length}
        </p>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500 dark:text-bodydark2">
            Por página:{' '}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value));
                setPage(0);
              }}
              className="rounded border border-stroke bg-transparent px-2 py-1 text-sm text-black outline-none dark:border-strokedark dark:text-white"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size} className="text-body dark:text-bodydark">
                  {size}
                </option>
              ))}
              <option value="all" className="text-body dark:text-bodydark">
                Todos
              </option>
            </select>
          </label>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="rounded border border-stroke px-3 py-1 text-sm text-black disabled:opacity-40 dark:border-strokedark dark:text-white"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i).map((page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => setPage(page)}
                  className={`rounded border px-3 py-1 text-sm ${
                    page === safePage
                      ? 'border-primary bg-primary text-white'
                      : 'border-stroke text-black dark:border-strokedark dark:text-white'
                  }`}
                >
                  {page + 1}
                </button>
              ))}
              <button type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="rounded border border-stroke px-3 py-1 text-sm text-black disabled:opacity-40 dark:border-strokedark dark:text-white"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaseTable;
