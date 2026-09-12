import type React from 'react';
import { type FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  MAX_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  cpfMask,
  sanitizePassword,
  sanitizeSafeText,
} from '../../common/input/InputSecurity';
import api from '../../service/api/Api';
import { SuccessModal } from '../Modals/SuccessModal';

interface UserRegistrationFormProps {
  onSuccess?: () => void;
}

export default function UserRegistrationForm({ onSuccess }: UserRegistrationFormProps) {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | false>('');
  const [formData, setFormData] = useState({
    cpf: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    role: 'USER' as 'USER' | 'ADMIN',
  });

  function resetForm() {
    setFormData({
      cpf: '',
      fullName: '',
      password: '',
      confirmPassword: '',
      role: 'USER',
    });
    setCpf('');
    setName('');
    setPassword('');
    setConfirmPassword('');
    setRole('USER');
    setErrorMessage('');
  }

  function handleSetCpf(event: React.ChangeEvent<HTMLInputElement>) {
    const masked = cpfMask(event.target.value);
    setCpf(masked);
    setFormData((prev) => ({ ...prev, cpf: masked }));
  }

  function handleSetName(event: React.ChangeEvent<HTMLInputElement>) {
    const sanitizedName = sanitizeSafeText(event.target.value);
    setName(sanitizedName);
    setFormData((prev) => ({ ...prev, fullName: sanitizedName }));
  }

  function handleSetPassword(event: React.ChangeEvent<HTMLInputElement>) {
    const sanitizedPassword = sanitizePassword(event.target.value);
    setPassword(sanitizedPassword);
    setFormData((prev) => ({ ...prev, password: sanitizedPassword }));
  }

  function handleSetConfirmPassword(event: React.ChangeEvent<HTMLInputElement>) {
    const sanitizedPassword = sanitizePassword(event.target.value);
    setConfirmPassword(sanitizedPassword);
    setFormData((prev) => ({ ...prev, confirmPassword: sanitizedPassword }));
  }

  function handleSetRole(event: React.ChangeEvent<HTMLSelectElement>) {
    const selectedRole = event.target.value === 'ADMIN' ? 'ADMIN' : 'USER';
    setRole(selectedRole);
    setFormData((prev) => ({ ...prev, role: selectedRole }));
  }

  function passwordValidationError(password: string, confirmPassword: string): string | null {
    if (password.length < 6) return 'Senha deve ter pelo menos 6 caracteres';
    if (password !== confirmPassword) return 'Senhas não conferem';
    return null;
  }

  function registerErrorMessage(error: unknown): { message: string; forbidden: boolean } {
    const response =
      typeof error === 'object' && error !== null
        ? (error as { response?: { status?: number; data?: unknown } }).response
        : undefined;
    let message = 'Erro ao realizar o registro';

    if (response?.status === 400) {
      message = getApiErrorMessage(response.data, message);
    }

    if (response?.status === 401 || response?.status === 403) {
      return { message: 'Você não tem permissão para usar esse recurso!', forbidden: true };
    }

    return { message, forbidden: false };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    try {
      event.preventDefault();

      const validationError = passwordValidationError(password, confirmPassword);
      if (validationError) {
        setErrorMessage(validationError);
        toast.error(validationError);
        return;
      }

      setLoadingData(true);
      setErrorMessage(false);

      const response = await api.post('/auth/register', formData);

      if (response.status === 200) {
        setSuccessModalOpen(true);
        resetForm();
        onSuccess?.();
      }
    } catch (error) {
      const { message, forbidden } = registerErrorMessage(error);
      if (forbidden) navigate('/auth/login');

      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoadingData(false);
    }
  }

  const inputClassName =
    'w-full rounded-lg border border-stroke bg-white px-4 py-3 text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary';

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div>
            <label
              htmlFor="urf-cpf"
              className="mb-2.5 block font-medium text-black dark:text-white"
            >
              CPF
            </label>
            <input
              id="urf-cpf"
              type="text"
              placeholder="Ex: 123.456.789-10"
              className={inputClassName}
              value={cpf}
              inputMode="numeric"
              maxLength={14}
              autoComplete="username"
              onChange={handleSetCpf}
              required
            />
          </div>

          <div>
            <label
              htmlFor="urf-tipo-de-acesso"
              className="mb-2.5 block font-medium text-black dark:text-white"
            >
              Tipo de acesso
            </label>
            <select
              id="urf-tipo-de-acesso"
              value={role}
              onChange={handleSetRole}
              className={inputClassName}
            >
              <option value="USER">Usuário comum</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="urf-nome" className="mb-2.5 block font-medium text-black dark:text-white">
            Nome
          </label>
          <input
            id="urf-nome"
            type="text"
            placeholder="Insira o nome do usuário"
            className={inputClassName}
            value={name}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="name"
            onChange={handleSetName}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div>
            <label
              htmlFor="urf-senha"
              className="mb-2.5 block font-medium text-black dark:text-white"
            >
              Senha
            </label>
            <input
              id="urf-senha"
              type="password"
              placeholder="Senha"
              className={inputClassName}
              value={password}
              minLength={6}
              maxLength={MAX_PASSWORD_LENGTH}
              autoComplete="new-password"
              onChange={handleSetPassword}
              required
            />
          </div>

          <div>
            <label
              htmlFor="urf-confirme-a-senha"
              className="mb-2.5 block font-medium text-black dark:text-white"
            >
              Confirme a senha
            </label>
            <input
              id="urf-confirme-a-senha"
              type="password"
              placeholder="Repita a senha"
              className={inputClassName}
              value={confirmPassword}
              minLength={6}
              maxLength={MAX_PASSWORD_LENGTH}
              autoComplete="new-password"
              onChange={handleSetConfirmPassword}
              required
            />
          </div>
        </div>

        {errorMessage && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-300">
            {errorMessage}
          </p>
        )}

        <div className="flex flex-col gap-3 border-t border-stroke pt-5 dark:border-strokedark sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600 dark:text-bodydark2">
            Apenas administradores podem criar ou promover contas.
          </p>
          <button
            type="submit"
            className="inline-flex min-w-[180px] items-center justify-center rounded-lg border border-primary bg-primary px-5 py-3 font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loadingData}
          >
            {loadingData && (
              <svg aria-hidden="true" className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24">
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
            Registrar usuário
          </button>
        </div>
      </form>

      <SuccessModal
        openModal={successModalOpen}
        handleModalClose={() => setSuccessModalOpen(false)}
        message="Registro realizado com sucesso!"
        position="center"
      />
    </>
  );
}

function getApiErrorMessage(data: unknown, fallback: string) {
  if (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray((data as { errors?: unknown }).errors) &&
    (data as { errors: unknown[] }).errors.length > 0
  ) {
    const first = (data as { errors: unknown[] }).errors[0];
    if (typeof first === 'string') return first;
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as { message?: unknown }).message === 'string' &&
    (data as { message: string }).message.trim()
  ) {
    return (data as { message: string }).message;
  }

  return fallback;
}
