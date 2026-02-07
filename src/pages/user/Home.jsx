import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../../hooks/AuthContext';

export default function Home() {
  const { user } = useAuthContext();

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Cabeçalho */}
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Bem-vindo, <span className="text-blue-600">{user.displayName || user.email.split('@')[0]}!</span> 💪
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Vamos treinar hoje?</p>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card Treinos */}
        <Link to="/trainings" className="transform hover:scale-105 transition duration-300">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-blue-500 hover:shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">🏋️</span>
              <span className="text-blue-500 font-bold">Meus Treinos</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Acesse seus treinos</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Comece a se exercitar agora</p>
          </div>
        </Link>

        {/* Card Histórico */}
        <Link to="/history" className="transform hover:scale-105 transition duration-300">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-green-500 hover:shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">📊</span>
              <span className="text-green-500 font-bold">Histórico</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Seu progresso</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Veja treinos realizados</p>
          </div>
        </Link>

        {/* Card Perfil */}
        <Link to="/profile" className="transform hover:scale-105 transition duration-300">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-purple-500 hover:shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">👤</span>
              <span className="text-purple-500 font-bold">Perfil</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Minha Conta</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Gerencie seus dados</p>
          </div>
        </Link>

      </div>
    </div>
  );
}