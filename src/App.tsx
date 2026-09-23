import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import Loader from './components/Loader';
import PageTitle from './components/PageTitle';
import ProtectedRoute from './components/ProtectedRoute';

const SignIn = lazy(() => import('./pages/Authentication/Login'));
const ManageUsers = lazy(() => import('./pages/Authentication/ManageUsers'));
const DadosGerais = lazy(() => import('./pages/Dashboard/DadosGerais'));
const GerenciarDados = lazy(() => import('./pages/Dashboard/GerenciarDados'));
const Sociodemografica = lazy(() => import('./pages/Dashboard/Sociodemografica'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  const { pathname } = useLocation();

  // biome-ignore lint/correctness/useExhaustiveDependencies: rerun on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Suspense fallback={<Loader />}>
    <Routes>
      <Route
        index
        element={
          <ProtectedRoute>
            <PageTitle title="Vigilância" />
            <DadosGerais />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/dadosGerais"
        element={
          <ProtectedRoute>
            <PageTitle title="Vigilância" />
            <DadosGerais />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/sociodemografica"
        element={
          <ProtectedRoute>
            <PageTitle title="Sociodemográfico SRAG" />
            <Sociodemografica />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/gerenciar"
        element={
          <ProtectedRoute>
            <PageTitle title="Gerenciar Dados SRAG" />
            <GerenciarDados />
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <PageTitle title="Meu Perfil" />
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auth/login"
        element={
          <>
            <PageTitle title="Login" />
            <SignIn />
          </>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <PageTitle title="Gerenciar Usuários" />
            <ManageUsers />
          </ProtectedRoute>
        }
      />
      <Route path="/auth/registrar" element={<Navigate to="/usuarios" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}

export default App;
