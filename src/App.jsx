import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './hooks/AuthContext';
import { ThemeProvider } from './hooks/ThemeContext';
import { Toaster } from 'react-hot-toast';

// Páginas - Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register'; // ✅ ADICIONADO: Import do Registro

// Páginas - User
import Home from './pages/user/Home';
import TrainingsPage from './pages/user/TrainingsPage'; 
import TrainingPage from './pages/user/TrainingPage';   
import TrainingExecutionPage from './pages/user/TrainingExecutionPage';
import HistoryPage from './pages/user/HistoryPage';
import Profile from './pages/user/Profile';
import MeasurementsPage from './pages/user/MeasurementsPage';

// Páginas - Admin
import AdminPanel from './pages/admin/AdminPanel';

// Componentes
import Navbar from './components/layout/Navbar'; // ✅ ATUALIZADO: Usando a nova Navbar Responsiva

// Componente de rota protegida
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white dark:bg-gray-900 transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppContent() {
  const { user } = useAuthContext();

  return (
    <>
      {/* Navbar aparece apenas se estiver logado (e dentro dela já tem a lógica Mobile/Desktop) */}
      {user && <Navbar />} 

      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Routes>
          {/* --- ROTAS PÚBLICAS --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} /> {/* ✅ ADICIONADO: Rota de Registro */}
          
          {/* Redirecionamento da raiz */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          
          {/* --- ROTAS PROTEGIDAS (Requer Login) --- */}
          
          {/* Dashboard */}
          <Route 
            path="/home" 
            element={<ProtectedRoute><Home /></ProtectedRoute>} 
          />
          
          {/* Perfil */}
          <Route 
            path="/profile" 
            element={<ProtectedRoute><Profile /></ProtectedRoute>} 
          />
          {/* Medidas Corporais */}
          <Route 
            path="/measurements" 
            element={<ProtectedRoute><MeasurementsPage /></ProtectedRoute>} 
          />
          {/* FLUXO DE TREINO */}
          {/* 1. Galeria */}
          <Route 
            path="/trainings" 
            element={<ProtectedRoute><TrainingsPage /></ProtectedRoute>} 
          />
          
          {/* 2. Detalhes (Antes de começar) */}
          <Route 
            path="/training/:trainingId" 
            element={<ProtectedRoute><TrainingPage /></ProtectedRoute>} 
          />
          
          {/* 3. Execução (Cronômetro + Vídeo) */}
          <Route 
            path="/execution/:trainingId" 
            element={<ProtectedRoute><TrainingExecutionPage /></ProtectedRoute>} 
          />

          {/* Histórico */}
          <Route 
            path="/history" 
            element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} 
          />
          
          {/* Painel Administrativo */}
          <Route 
            path="/admin/*" 
            element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} 
          />

          {/* Rota 404 - Redireciona para Home */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
          
          {/* Configuração Global dos Toasts (Notificações) */}
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#333',
                color: '#fff',
              },
              className: 'dark:bg-gray-800 dark:text-white dark:border dark:border-gray-700', 
            }}
          />
          
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}