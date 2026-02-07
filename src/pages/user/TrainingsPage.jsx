import React from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';

export default function TrainingsPage() {
  const { trainings, loading, error } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Meus Treinos 🏋️</h1>
        
        {trainings.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Nenhum treino disponível no momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainings.map((training) => (
              <div 
                key={training.firestoreId} 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col"
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white line-clamp-1" title={training.name}>
                      {training.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold whitespace-nowrap ml-2
                      ${training.difficulty === 'iniciante' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                        training.difficulty === 'intermediário' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                      {training.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm line-clamp-3 h-14">
                    {training.description}
                  </p>
                  
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-6 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                    <span className="mr-2">📋</span>
                    <span className="font-medium">
                      {training.exercises?.length || 0} Exercícios
                    </span>
                  </div>

                  <Link 
                    // CORREÇÃO CRÍTICA AQUI: Mudamos de .id para .firestoreId
                    to={`/training/${training.firestoreId}`} 
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-transform hover:scale-[1.02] active:scale-95 shadow-md shadow-blue-500/20"
                  >
                    Iniciar Treino ▶️
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}