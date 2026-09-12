import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import Loader from './components/Loader';
import PageTitle from './components/PageTitle';
import ProtectedRoute from './components/ProtectedRoute';
import SignIn from './pages/Authentication/Login';
import ManageUsers from './pages/Authentication/ManageUsers';
import DadosGerais from './pages/Dashboard/DadosGerais';
import GerenciarDados from './pages/Dashboard/GerenciarDados';
import Sociodemografica from './pages/Dashboard/Sociodemografica';
import Profile from './pages/Profile';

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const { pathname } = useLocation();

  // biome-ignore lint/correctness/useExhaustiveDependencies: rerun on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return loading ? (
    <Loader />
  ) : (
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
  );
}

export default App;
