// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './hooks/AuthContext';
import { ThemeProvider } from './hooks/ThemeContext';
import { Toaster } from 'react-hot-toast'; // <--- Import do Toaster

// Páginas - Auth
import Login from './pages/auth/Login';

// Páginas - User
import Home from './pages/user/Home';
import TrainingPage from './pages/user/TrainingPage';
import TrainingExecutionPage from './pages/user/TrainingExecutionPage';
import HistoryPage from './pages/user/HistoryPage';
import Profile from './pages/user/Profile';

// Páginas - Admin
import AdminPanel from './pages/admin/AdminPanel';

// Componentes
import Navigation from './components/common/Navigation';

// Componente de rota protegida
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl dark:bg-gray-900 dark:text-white">
        Carregando...
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
      {user && <Navigation />}
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
          
          {/* Rotas Protegidas - Usuário */}
          <Route 
            path="/home" 
            element={<ProtectedRoute><Home /></ProtectedRoute>} 
          />
          <Route 
            path="/profile" 
            element={<ProtectedRoute><Profile /></ProtectedRoute>} 
          />
          <Route 
            path="/trainings" 
            element={<ProtectedRoute><TrainingPage /></ProtectedRoute>} 
          />
          <Route 
            path="/training/:trainingId" 
            element={<ProtectedRoute><TrainingExecutionPage /></ProtectedRoute>} 
          />
          <Route 
            path="/history" 
            element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} 
          />
          
          {/* Rota do Painel Administrativo */}
          <Route 
            path="/admin/*" 
            element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} 
          />

          {/* Rota padrão */}
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
          
          {/* Configuração Global dos Toasts */}
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#333',
                color: '#fff',
              },
              // Classes para Dark Mode automático nos toasts
              className: 'dark:bg-gray-800 dark:text-white dark:border dark:border-gray-700', 
            }}
          />
          
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}