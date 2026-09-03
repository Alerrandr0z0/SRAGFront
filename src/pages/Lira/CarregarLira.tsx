import React, { useState, useEffect } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '../../layout/DefaultLayout';
import api from '../../service/api/Api';
import { MAX_UPLOAD_LABEL, validateUploadFile } from '../../common/input/InputSecurity';
import { ANO_PADRAO, CICLOS_LIRA, rotuloCiclo } from './liraCiclos';

const CarregarLira: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState<number>(ANO_PADRAO);
  const [liraNumber, setLiraNumber] = useState<number>(1);
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [existingDataCount, setExistingDataCount] = useState<number | null>(null);
  const [checkingExistingData, setCheckingExistingData] = useState<boolean>(false);

  // Check for existing data when year or liraNumber changes
  useEffect(() => {
    checkExistingData();
  }, [year, liraNumber]);

  const checkExistingData = async () => {
    setCheckingExistingData(true);
    try {
      const response = await api.get(`/lira/filter?ano=${year}&liraNumber=${liraNumber}`);
      setExistingDataCount(response.data.length);
    } catch (error) {
      setExistingDataCount(0);
    } finally {
      setCheckingExistingData(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = event.target.files?.[0];
    if (uploaded) {
      const validationError = validateUploadFile(uploaded, ['xlsx']);
      if (validationError) {
        setFile(null);
        setMessage(validationError);
        event.target.value = '';
        return;
      }

      setFile(uploaded);
      setMessage('');
    }
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setYear(Number(event.target.value));
  };

  const handleLiraNumberChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLiraNumber(Number(event.target.value));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !year || !liraNumber) {
      setMessage('Por favor, selecione um arquivo, um ano e o ciclo do LIRA.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ano', year.toString());
    formData.append('liraNumber', liraNumber.toString());

    try {
      const response = await api.post('/lira/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const wasOverwritten = existingDataCount && existingDataCount > 0;
      const overwriteMessage = wasOverwritten 
        ? ` Os ${existingDataCount} registros anteriores foram substituídos.` 
        : '';
      
      const qtd = response.data.length;
      const alerta = qtd !== 30
        ? ` ⚠️ Esperado 30 bairros, vieram ${qtd} — confira o arquivo.`
        : '';
      setMessage(`Arquivo LIRA ciclo ${liraNumber}/${year} enviado! ${qtd} registros.${alerta}${overwriteMessage}`);
      
      setFile(null);
      setExistingDataCount(response.data.length); // Update with new count
      
      // Reset file input
      const fileInput = document.getElementById('lira-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Erro ao enviar o arquivo LIRA:', error);
      setMessage('Erro ao enviar o arquivo LIRA. Verifique o console para mais detalhes.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Carregar Dados LIRA" />
      <div className="grid grid-cols-1 gap-9">
        <div className="flex flex-col gap-9">
          {/* Upload Form */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Upload de Arquivo LIRA (.xlsx)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Envie os dados do Levantamento de Índice Rápido de Aedes aegypti
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-6.5">
              <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                <div className="w-full xl:w-1/2">
                  <label className="mb-2.5 block text-black dark:text-white">
                    Ano <span className="text-meta-1">*</span>
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={handleYearChange}
                    min="2020"
                    max="2030"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    placeholder="Ex: 2023"
                  />
                </div>

                <div className="w-full xl:w-1/2">
                  <label className="mb-2.5 block text-black dark:text-white">
                    Ciclo do LIRA <span className="text-meta-1">*</span>
                  </label>
                  <select
                    value={liraNumber}
                    onChange={handleLiraNumberChange}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  >
                    {CICLOS_LIRA.map((n) => (
                      <option key={n} value={n}>{rotuloCiclo(n)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2.5 block text-black dark:text-white">
                  Arquivo LIRA (.xlsx) <span className="text-meta-1">*</span>
                </label>
                <input
                  id="lira-file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".xlsx"
                  className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:py-3 file:px-5 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Apenas arquivos .xlsx são aceitos. Máximo {MAX_UPLOAD_LABEL}.
                </p>
              </div>

              {/* Warning for existing data */}
              {!checkingExistingData && existingDataCount !== null && existingDataCount > 0 && (
                <div className="mb-6 p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-md dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    <div>
                      <p className="font-medium">Atenção: Dados Existentes</p>
                      <p className="text-sm mt-1">
                        Já existem <strong>{existingDataCount} registros</strong> para o LIRA {liraNumber} de {year}. 
                        Ao enviar um novo arquivo, todos os dados anteriores serão <strong>substituídos</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90 disabled:bg-opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </div>
                ) : (
                  'Enviar Arquivo'
                )}
              </button>

              {message && (
                <div className={`mt-4 p-4 rounded-md ${
                  message.includes('enviado')
                    ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50' 
                    : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50'
                }`}>
                  <p className="text-sm font-medium">{message}</p>
                </div>
              )}
            </form>
          </div>

          {/* Information Card */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Informações sobre o LIRA
              </h3>
            </div>
            <div className="p-6.5">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {CICLOS_LIRA.map((n) => (
                  <div key={n} className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="text-2xl font-bold text-primary">{n}</div>
                    <div className="text-sm text-center">{rotuloCiclo(n)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900/50">
                  <p className="text-sm text-blue-800 dark:text-blue-400">
                    <strong>Formato do Arquivo:</strong> Certifique-se de que o arquivo Excel está no formato correto, 
                    com as colunas na ordem esperada: Bairros, Total de Imóveis Inspecionados, 
                    Total de Imóveis Positivos, Índice de Infestação Predial, etc.
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-900/50">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    <strong>Substituição de Dados:</strong> Se já existirem dados para o mesmo ano e ciclo,
                    eles serão completamente substituídos pelos novos dados do arquivo enviado. 
                    Esta operação não pode ser desfeita.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default CarregarLira;
