import React from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin'; // Reutilizando hook que busca treinos

export default function TrainingPage() {
  const { trainings, loading, error } = useAdmin(); // Ou useTrainings se você tiver separado
  // Nota: Se você ainda não tem o hook 'useTrainings' específico, o 'useAdmin' funciona pois busca a mesma coleção

  if (loading) return <div className="text-center mt-10 text-xl dark:text-white">Carregando treinos...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Meus Treinos 🏋️</h1>
      
      {trainings.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">Nenhum treino encontrado. Peça ao seu treinador (ou admin) para criar um!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainings.map((training) => (
            <div key={training.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">{training.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full font-semibold
                    ${training.difficulty === 'iniciante' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                      training.difficulty === 'intermediário' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                    {training.difficulty}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm line-clamp-2">
                  {training.description}
                </p>
                
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {training.exercises?.length || 0} Exercícios
                  </span>
                </div>

                <Link 
                  to={`/training/${training.id}`}
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Iniciar Treino ▶️
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}