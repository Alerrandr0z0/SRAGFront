import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import UserRegistrationForm from '../../components/Users/UserRegistrationForm';
import { useAuth } from '../../contexts/AuthContext';
import DefaultLayout from '../../layout/DefaultLayout';
import api from '../../service/api/Api';

type Tab = 'list' | 'register';

interface ManagedUser {
  id: number;
  name: string;
  cpf: string;
  role: 'USER' | 'ADMIN';
}

export default function ManageUsers() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('list');
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/user/manage');
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(resolveApiMessage(err, 'Não foi possível carregar os usuários.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return users;

    return users.filter(
      (managedUser) =>
        managedUser.name.toLowerCase().includes(normalizedSearch) ||
        managedUser.cpf.toLowerCase().includes(normalizedSearch) ||
        managedUser.role.toLowerCase().includes(normalizedSearch),
    );
  }, [search, users]);

  const adminCount = users.filter((managedUser) => managedUser.role === 'ADMIN').length;
  const userCount = users.length - adminCount;

  async function handleDeleteUser() {
    if (!userToDelete) return;

    try {
      setDeletingId(userToDelete.id);
      await api.delete(`/user/${userToDelete.id}`);
      setUsers((current) => current.filter((managedUser) => managedUser.id !== userToDelete.id));
      toast.success('Usuário removido com sucesso.');
      setUserToDelete(null);
    } catch (err) {
      toast.error(resolveApiMessage(err, 'Não foi possível remover o usuário.'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Breadcrumb pageName="Gerenciar Usuários" />

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
            <p className="text-sm font-medium text-gray-500 dark:text-bodydark2">Total de contas</p>
            <p className="mt-2 text-3xl font-semibold text-black dark:text-white">{users.length}</p>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm dark:border-indigo-800/60 dark:bg-indigo-950/30">
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              Administradores
            </p>
            <p className="mt-2 text-3xl font-semibold text-indigo-700 dark:text-indigo-200">
              {adminCount}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-800/60 dark:bg-emerald-950/30">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Usuários comuns
            </p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700 dark:text-emerald-200">
              {userCount}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-4 pt-4 dark:border-strokedark sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-primary">Gerenciar Usuários</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-bodydark2">
                  Área exclusiva para admins com listagem, remoção e cadastro de contas.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-strokedark">
                {(
                  [
                    ['list', 'Usuários cadastrados'],
                    ['register', 'Registrar novo usuário'],
                  ] as [Tab, string][]
                ).map(([currentTab, label]) => (
                  <button
                    type="button"
                    key={currentTab}
                    onClick={() => setTab(currentTab)}
                    className={`rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition ${
                      tab === currentTab
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-black dark:text-bodydark2 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {tab === 'list' && (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="w-full lg:max-w-md">
                    <label
                      htmlFor="manage-users-search"
                      className="mb-2 block text-sm font-medium text-black dark:text-white"
                    >
                      Buscar usuário
                    </label>
                    <input
                      id="manage-users-search"
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Busque por nome, CPF ou perfil"
                      className="w-full rounded-lg border border-stroke bg-white px-4 py-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={loadUsers}
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-lg border border-stroke px-4 py-3 text-sm font-medium text-black transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                  >
                    {loading ? 'Atualizando...' : 'Atualizar lista'}
                  </button>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                  </div>
                )}

                <div className="hidden overflow-hidden rounded-xl border border-stroke dark:border-strokedark lg:block">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 dark:bg-meta-4">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-bodydark2">
                            Nome
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-bodydark2">
                            CPF
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-bodydark2">
                            Perfil
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-bodydark2">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stroke bg-white dark:divide-strokedark dark:bg-boxdark">
                        {filteredUsers.map((managedUser) => {
                          const isCurrentUser = managedUser.cpf === user?.cpf;
                          return (
                            <tr
                              key={managedUser.id}
                              className="transition hover:bg-gray-50 dark:hover:bg-meta-4"
                            >
                              <td className="px-4 py-4 text-sm text-black dark:text-white">
                                {managedUser.name}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-700 dark:text-bodydark">
                                {managedUser.cpf}
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                    managedUser.role === 'ADMIN'
                                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                  }`}
                                >
                                  {managedUser.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setUserToDelete(managedUser)}
                                  disabled={isCurrentUser || deletingId === managedUser.id}
                                  className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                                >
                                  {deletingId === managedUser.id
                                    ? 'Removendo...'
                                    : isCurrentUser
                                      ? 'Conta atual'
                                      : 'Apagar login'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:hidden">
                  {filteredUsers.map((managedUser) => {
                    const isCurrentUser = managedUser.cpf === user?.cpf;
                    return (
                      <div
                        key={managedUser.id}
                        className="rounded-xl border border-stroke bg-white p-4 shadow-sm dark:border-strokedark dark:bg-boxdark"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold text-black dark:text-white">
                              {managedUser.name}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600 dark:text-bodydark2">
                              {managedUser.cpf}
                            </p>
                          </div>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              managedUser.role === 'ADMIN'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            }`}
                          >
                            {managedUser.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setUserToDelete(managedUser)}
                          disabled={isCurrentUser || deletingId === managedUser.id}
                          className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                        >
                          {deletingId === managedUser.id
                            ? 'Removendo...'
                            : isCurrentUser
                              ? 'Conta atual'
                              : 'Apagar login'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {!loading && filteredUsers.length === 0 && (
                  <div className="rounded-xl border border-dashed border-stroke px-6 py-12 text-center text-gray-500 dark:border-strokedark dark:text-bodydark2">
                    Nenhum usuário encontrado com os filtros atuais.
                  </div>
                )}
              </div>
            )}

            {tab === 'register' && (
              <div className="rounded-2xl border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4/30 sm:p-6">
                <div className="mb-5">
                  <h3 className="text-xl font-semibold text-black dark:text-white">
                    Registrar novo usuário
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-bodydark2">
                    Cadastre novas contas e defina o perfil de acesso diretamente nesta subaba.
                  </p>
                </div>

                <UserRegistrationForm onSuccess={loadUsers} />
              </div>
            )}
          </div>
        </div>
      </div>

      {userToDelete && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-boxdark">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <svg
                  aria-hidden="true"
                  className="h-6 w-6 text-red-600 dark:text-red-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.65 18h16.7a1 1 0 00.86-1.5l-7.5-13a1 1 0 00-1.72 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  Apagar login do usuário
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-bodydark2">
                  Essa ação removerá o acesso de <strong>{userToDelete.name}</strong> ao sistema.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deletingId === userToDelete.id}
                className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-black transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deletingId === userToDelete.id}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === userToDelete.id ? 'Apagando...' : 'Confirmar exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
}

function resolveApiMessage(error: unknown, fallback: string) {
  const data =
    typeof error === 'object' && error !== null
      ? (error as { response?: { data?: { errors?: unknown; message?: unknown } } }).response?.data
      : undefined;
  if (Array.isArray(data?.errors) && data.errors.length > 0 && typeof data.errors[0] === 'string') {
    return data.errors[0];
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }

  return fallback;
}
