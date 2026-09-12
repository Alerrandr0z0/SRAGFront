import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DefaultLayout from '../../layout/DefaultLayout';
import {
  downloadErrorsPdf,
  type ErrorsResponse,
  getManageErrors,
  getSragIngestJob,
  getSragIngestStatus,
  type IngestJob,
  type IngestResult,
  type IngestStatus,
  type QuarantineItem,
  uploadSragSpreadsheet,
} from '../../service/srag/sragClient';

const MAX_MB = 100;
const ACCEPTED = ['.xlsx', '.csv', '.json', '.xml', '.parquet'];
const ACCEPT_ATTR = ACCEPTED.join(',');

type Tab = 'importar' | 'erros';

const GerenciarDados: React.FC = () => {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>('importar');
  const [status, setStatus] = useState<IngestStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<IngestResult | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    setStatusError(null);
    try {
      setStatus(await getSragIngestStatus());
    } catch {
      setStatusError('Não foi possível carregar o estado atual da base.');
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchStatus();
  }, [isAdmin, fetchStatus]);

  if (!isAdmin) {
    return (
      <DefaultLayout>
        <p className="py-16 text-center text-red-600">
          Acesso restrito: somente administradores podem gerenciar os dados.
        </p>
      </DefaultLayout>
    );
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null);
    setResult(null);
    setFile(null);
    const uploaded = event.target.files?.[0];
    if (!uploaded) return;
    const ext = `.${uploaded.name.split('.').pop()?.toLowerCase() ?? ''}`;
    if (!ACCEPTED.includes(ext)) {
      setUploadError('Formato inválido. Aceitos: .xlsx, .csv, .json, .xml, .parquet.');
      event.target.value = '';
      return;
    }
    if (uploaded.size > MAX_MB * 1024 * 1024) {
      setUploadError(`Arquivo excede ${MAX_MB}MB.`);
      event.target.value = '';
      return;
    }
    setFile(uploaded);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setResult(null);
    try {
      const res = await uploadSragSpreadsheet(file);
      setFile(null);
      if (res.status === 'processing' || res.message === 'Processamento iniciado.') {
        await pollIngestJob(res.file);
      } else {
        setResult(res);
        await fetchStatus();
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Falha no envio do arquivo.';
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  }

  async function pollIngestAttempt(fileName: string): Promise<boolean> {
    let job: IngestJob;
    try {
      job = await getSragIngestJob();
    } catch {
      return false;
    }
    if (job.file && job.file !== fileName) return false;
    if (job.state === 'done') {
      setResult({
        message: 'Ingestão concluída com sucesso!',
        file: job.file ?? fileName,
        stats: job.stats ?? undefined,
      });
      await fetchStatus();
      return true;
    }
    if (job.state === 'error') {
      setUploadError(job.error ?? 'Falha na ingestão.');
      await fetchStatus();
      return true;
    }
    return false;
  }

  async function pollIngestJob(fileName: string) {
    for (let attempt = 0; attempt < 120; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      if (await pollIngestAttempt(fileName)) return;
    }
    setUploadError('Tempo esgotado aguardando a ingestão. Verifique o estado da base.');
    await fetchStatus();
  }

  return (
    <DefaultLayout>
      <div className="mx-auto p-6">
        <h1 className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400 mb-5">
          Gerir Notificações
        </h1>

        <div className="flex border-b border-gray-200 dark:border-strokedark mb-6">
          {(
            [
              ['importar', 'Importar Notificações'],
              ['erros', 'Dados com Algum Erro'],
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <button
              type="button"
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${
                tab === t
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-bodydark2 hover:text-gray-700 dark:hover:text-bodydark'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'importar' && (
          <div className="bg-white dark:bg-boxdark shadow-md rounded-lg p-6">
            <div className="border-2 border-dashed border-primary/40 rounded-lg p-6 text-center">
              <p className="font-medium text-black dark:text-white">
                Selecione o arquivo SIVEP-Gripe
              </p>
              <label
                htmlFor="srag-upload"
                className="inline-block mt-2 px-4 py-2 bg-primary text-white rounded-md cursor-pointer hover:bg-opacity-90 transition"
              >
                Escolher arquivo
                <input
                  id="srag-upload"
                  type="file"
                  className="sr-only"
                  accept={ACCEPT_ATTR}
                  onChange={handleFileChange}
                />
              </label>
              {file && <p className="mt-2 font-medium text-green-600">Selecionado: {file.name}</p>}
              <p className="mt-2 text-xs text-gray-500">
                .xlsx, .csv, .json, .xml ou .parquet · Tamanho máximo: {MAX_MB}MB.
              </p>
              {uploadError && <p className="mt-3 text-red-600">{uploadError}</p>}
            </div>

            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex items-center bg-primary text-white px-6 py-2 rounded hover:bg-opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {uploading && (
                  <svg aria-hidden="true" className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                )}
                {uploading ? 'Processando…' : 'Enviar e atualizar base'}
              </button>
            </div>

            {result && (
              <div className="mt-6 rounded border border-green-300 bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
                <p className="font-semibold">{result.message}</p>
                {result.stats && (
                  <p>
                    Arquivo: {result.file} · Fontes: {result.stats.sources} · Lidos:{' '}
                    {result.stats.temp_cases} · Únicos: {result.stats.unique_cases} · Duplicatas
                    removidas: {result.stats.duplicates_removed}
                    {result.stats.quarantined != null && (
                      <> · Quarentena: {result.stats.quarantined}</>
                    )}
                  </p>
                )}
              </div>
            )}
            {statusError && <p className="mt-2 text-sm text-red-600">{statusError}</p>}
            {!loadingStatus && status && (
              <p className="mt-4 text-center text-xs text-gray-500 dark:text-bodydark2">
                Base: {status.total} registros · Anos {(status.available_years ?? []).join(', ')} ·
                Última notificação {status.latest_notific ?? '—'}
              </p>
            )}
          </div>
        )}

        {tab === 'erros' && <ErrorsManager />}
      </div>
    </DefaultLayout>
  );
};

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-boxdark p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-black dark:text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded px-2 py-1 text-xl text-gray-500 hover:bg-gray-100 dark:text-bodydark2 dark:hover:bg-meta-4"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Badge por categoria de erro (cores e vocabulário da referência).
const CATEGORY_BADGE: Record<string, string> = {
  'Data faltando': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Bairro faltando': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Sexo não informado': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'Classificação faltando':
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Evolução não informada': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Data inválida': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500',
  'Valor inválido': 'bg-gray-100 text-gray-700 dark:bg-meta-4 dark:text-bodydark1',
  'Campo obrigatório ausente':
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};
const DEFAULT_BADGE = 'bg-gray-100 text-gray-700 dark:bg-meta-4 dark:text-bodydark1';

// Lista fixa de problemas (como na referência), sempre visível.
const PROBLEMAS = [
  'Data faltando',
  'Bairro faltando',
  'Sexo não informado',
  'Classificação faltando',
  'Evolução não informada',
];

function categoryBadge(category: string | null): string {
  if (!category) return DEFAULT_BADGE;
  if (CATEGORY_BADGE[category]) return CATEGORY_BADGE[category];
  if (category.includes('Data')) return CATEGORY_BADGE['Data inválida'];
  return DEFAULT_BADGE;
}

function formatDateBR(iso: unknown): string {
  if (typeof iso !== 'string' || !iso) return '—';
  const parts = iso.slice(0, 10).split('-');
  if (parts.length !== 3) return String(iso);
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function isoToBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// Agente viral derivado da CLASSI_FIN (equivale à "doença" da referência:
// SRAG é a síndrome; o agente é a doença).
const AGENTS = [
  { value: '', label: 'Todos os agentes' },
  { value: 'INFLUENZA', label: 'Influenza' },
  { value: 'COVID-19', label: 'Covid-19' },
  { value: 'OUTRO_VIRUS', label: 'Outro vírus' },
  { value: 'OUTRO_AGENTE', label: 'Outro agente' },
  { value: 'NAO_ESPECIFICADO', label: 'Não especificado' },
];

function agentLabel(code: unknown): string {
  return AGENTS.find((a) => a.value === code)?.label ?? 'Não especificado';
}

interface ErrorsFilterState {
  category: string;
  agent: string;
  startDate: string;
  endDate: string;
}

function activeFiltersSummary(filters: ErrorsFilterState, categoryLabel: string): string {
  const parts: string[] = [];
  if (filters.category) parts.push(`Problema: ${categoryLabel}`);
  if (filters.agent) parts.push(`Agente: ${agentLabel(filters.agent)}`);
  if (filters.startDate) parts.push(`De: ${isoToBR(filters.startDate)}`);
  if (filters.endDate) parts.push(`Até: ${isoToBR(filters.endDate)}`);
  return parts.join(' | ');
}

function errorsPdfParams(useFilters: boolean, filters: ErrorsFilterState) {
  if (!useFilters) return {};
  return {
    category: filters.category || undefined,
    agent: filters.agent || undefined,
    start_date: filters.startDate || undefined,
    end_date: filters.endDate || undefined,
  };
}

function problemCount(data: ErrorsResponse | null, problem: string): number | null {
  return (data?.categories ?? []).find((c) => c.category === problem)?.count ?? null;
}

function ExportPdfModal({
  hasAnyFilter,
  summary,
  pdfLoading,
  pdfError,
  onExport,
  onClose,
}: {
  hasAnyFilter: boolean;
  summary: string;
  pdfLoading: boolean;
  pdfError: string | null;
  onExport: (useFilters: boolean) => void;
  onClose: () => void;
}) {
  return (
    <Modal title="Exportar relatório PDF" onClose={onClose}>
      {hasAnyFilter ? (
        <>
          <p className="text-sm text-gray-600 dark:text-bodydark mb-1">
            Você possui filtros ativos. Como deseja exportar?
          </p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-4">{summary}</p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => onExport(true)}
              disabled={pdfLoading}
              className="flex items-center justify-center gap-2 rounded-lg border-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 text-sm font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 disabled:opacity-60 transition"
            >
              {pdfLoading ? 'Gerando PDF…' : 'Exportar apenas com os filtros ativos'}
            </button>
            <button
              type="button"
              onClick={() => onExport(false)}
              disabled={pdfLoading}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-strokedark px-4 py-3 text-sm font-medium text-gray-700 dark:text-bodydark hover:bg-gray-50 dark:hover:bg-meta-4 disabled:opacity-60 transition"
            >
              Exportar todos os dados com erros
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600 dark:text-bodydark mb-5">
            Nenhum filtro aplicado. Deseja exportar <strong>todos os dados com erros</strong>?
          </p>
          <button
            type="button"
            onClick={() => onExport(false)}
            disabled={pdfLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 transition"
          >
            {pdfLoading ? 'Gerando PDF...' : 'Sim, exportar todos'}
          </button>
        </>
      )}
      {pdfError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{pdfError}</p>}
      <button
        type="button"
        onClick={onClose}
        disabled={pdfLoading}
        className="mt-3 w-full rounded-lg px-4 py-2 text-sm text-gray-500 dark:text-bodydark2 hover:bg-gray-100 dark:hover:bg-meta-4 disabled:opacity-60 transition"
      >
        Cancelar
      </button>
    </Modal>
  );
}

function ErrorsManager() {
  const [category, setCategory] = useState('');
  const [agent, setAgent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<ErrorsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const fetchErrors = useCallback(
    async (
      nextPage: number,
      nextCategory: string,
      nextAgent: string,
      nextStart: string,
      nextEnd: string,
    ) => {
      setLoading(true);
      try {
        setData(
          await getManageErrors({
            page: nextPage,
            page_size: 20,
            category: nextCategory || undefined,
            agent: nextAgent || undefined,
            start_date: nextStart || undefined,
            end_date: nextEnd || undefined,
          }),
        );
        setPage(nextPage);
      } catch {
        /* silencioso, como na referência */
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on filter change
  useEffect(() => {
    setPage(1);
  }, [category, agent, startDate, endDate]);

  useEffect(() => {
    fetchErrors(page, category, agent, startDate, endDate);
  }, [page, category, agent, startDate, endDate, fetchErrors]);

  async function handleExportPdf(useFilters: boolean) {
    setPdfLoading(true);
    setPdfError(null);
    try {
      await downloadErrorsPdf(errorsPdfParams(useFilters, { category, agent, startDate, endDate }));
      setPdfOpen(false);
    } catch {
      setPdfError('Erro ao gerar o PDF.');
    } finally {
      setPdfLoading(false);
    }
  }

  const hasAnyFilter = !!(category || agent || startDate || endDate);
  const categoryLabel =
    (data?.categories ?? []).find((c) => c.category === category)?.category ?? category;

  const thCls =
    'px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-bodydark2 uppercase tracking-wide';
  const tdCls = 'px-3 py-2 text-sm text-gray-700 dark:text-bodydark whitespace-nowrap';

  const totalElements = data?.total ?? 0;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <>
      <div className="rounded-lg border border-gray-200 dark:border-strokedark bg-white dark:bg-boxdark p-4 mb-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="gd-category"
              className="text-xs font-medium text-gray-500 dark:text-bodydark2 uppercase tracking-wide"
            >
              Problema
            </label>
            <select
              id="gd-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded border border-gray-300 dark:border-form-strokedark bg-white dark:bg-form-input text-gray-800 dark:text-bodydark px-3 py-1.5 text-sm w-52 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todos os problemas</option>
              {PROBLEMAS.map((p) => {
                const count = problemCount(data, p);
                return (
                  <option key={p} value={p}>
                    {p}
                    {count != null ? ` (${count})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="gd-agent"
              className="text-xs font-medium text-gray-500 dark:text-bodydark2 uppercase tracking-wide"
            >
              Agente
            </label>
            <select
              id="gd-agent"
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              className="rounded border border-gray-300 dark:border-form-strokedark bg-white dark:bg-form-input text-gray-800 dark:text-bodydark px-3 py-1.5 text-sm w-44 focus:border-indigo-500 focus:outline-none"
            >
              {AGENTS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="gd-start"
              className="text-xs font-medium text-gray-500 dark:text-bodydark2 uppercase tracking-wide"
            >
              Data início
            </label>
            <input
              id="gd-start"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded border border-gray-300 dark:border-form-strokedark bg-white dark:bg-form-input text-gray-800 dark:text-bodydark px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="gd-end"
              className="text-xs font-medium text-gray-500 dark:text-bodydark2 uppercase tracking-wide"
            >
              Data fim
            </label>
            <input
              id="gd-end"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded border border-gray-300 dark:border-form-strokedark bg-white dark:bg-form-input text-gray-800 dark:text-bodydark px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {hasAnyFilter && (
            <button
              type="button"
              onClick={() => {
                setCategory('');
                setAgent('');
                setStartDate('');
                setEndDate('');
              }}
              className="rounded border border-gray-300 dark:border-strokedark px-3 py-1.5 text-sm text-gray-500 dark:text-bodydark2 hover:bg-gray-100 dark:hover:bg-meta-4 transition"
            >
              Limpar filtros
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setPdfError(null);
              setPdfOpen(true);
            }}
            className="ml-auto flex items-center gap-2 rounded bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            Exportar PDF
          </button>
        </div>

        {hasAnyFilter && (
          <p className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            Filtros ativos:{' '}
            {activeFiltersSummary({ category, agent, startDate, endDate }, categoryLabel)}
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-strokedark bg-white dark:bg-boxdark shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <svg
              aria-hidden="true"
              className="animate-spin h-8 w-8 text-indigo-500"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        ) : totalElements === 0 ? (
          <p className="py-16 text-center text-gray-400 dark:text-bodydark2">
            Nenhum registro encontrado.
          </p>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-meta-4 border-b border-gray-200 dark:border-strokedark">
              <tr>
                <th className={thCls}>Agente</th>
                <th className={thCls}>Data Notif.</th>
                <th className={thCls}>Bairro</th>
                <th className={thCls}>Sexo</th>
                <th className={thCls}>Classificação</th>
                <th className={thCls}>Evolução</th>
                <th className={thCls}>Sem. Epid.</th>
                <th className={thCls}>Problema</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-strokedark">
              {(data?.items ?? []).map((item: QuarantineItem) => {
                const raw = (item.raw_record ?? {}) as Record<string, unknown>;
                const str = (v: unknown) =>
                  v === null || v === undefined || v === '' ? '—' : String(v);
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
                  >
                    <td className={tdCls}>{agentLabel(item.agente)}</td>
                    <td className={tdCls}>{formatDateBR(raw.DT_NOTIFIC)}</td>
                    <td className={tdCls}>
                      {str((raw.NM_BAIRRO as string) || (raw.BAIRRO_REF as string))}
                    </td>
                    <td className={tdCls}>{str(raw.CS_SEXO)}</td>
                    <td className={tdCls}>{str(raw.CLASSI_FIN)}</td>
                    <td className={tdCls}>{str(raw.EVOLUCAO)}</td>
                    <td className={`${tdCls} text-center`}>{item.semana_epidemiologica ?? '—'}</td>
                    <td className={tdCls}>
                      <span
                        title={item.error_detail ?? ''}
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${categoryBadge(item.error_category)}`}
                      >
                        {item.error_category ?? 'Outros'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-bodydark">
          <span>
            {totalElements} registros — Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded border border-gray-300 dark:border-strokedark px-3 py-1 text-gray-600 dark:text-bodydark hover:bg-gray-100 dark:hover:bg-meta-4 disabled:opacity-40 transition"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded border border-gray-300 dark:border-strokedark px-3 py-1 text-gray-600 dark:text-bodydark hover:bg-gray-100 dark:hover:bg-meta-4 disabled:opacity-40 transition"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}

      {pdfOpen && (
        <ExportPdfModal
          hasAnyFilter={hasAnyFilter}
          summary={activeFiltersSummary({ category, agent, startDate, endDate }, categoryLabel)}
          pdfLoading={pdfLoading}
          pdfError={pdfError}
          onExport={handleExportPdf}
          onClose={() => !pdfLoading && setPdfOpen(false)}
        />
      )}
    </>
  );
}

export default GerenciarDados;
