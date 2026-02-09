import React from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';

// Ícone SVG de Halter para substituir a Letra
const DumbbellIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M6.5 5.5H8.5C9.60457 5.5 10.5 6.39543 10.5 7.5V16.5C10.5 17.6046 9.60457 18.5 8.5 18.5H6.5M6.5 5.5C5.39543 5.5 4.5 6.39543 4.5 7.5V16.5C4.5 17.6046 5.39543 18.5 6.5 18.5M6.5 5.5V18.5M17.5 5.5H15.5C14.3954 5.5 13.5 6.39543 13.5 7.5V16.5C13.5 17.6046 14.3954 18.5 15.5 18.5H17.5M17.5 5.5C18.6046 5.5 19.5 6.39543 19.5 7.5V16.5C19.5 17.6046 18.6046 18.5 17.5 18.5M17.5 5.5V18.5M2 9.5H22M2 14.5H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function TrainingsPage() {
  const { trainings, loading, error } = useAdmin();

  // Cores baseadas na dificuldade
  const getDifficultyColor = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'iniciante': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'intermediário': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'avançado': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center dark:text-white">Erro: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pb-24 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight mb-2">
                Fichas de Treino
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
                Selecione o protocolo de hoje.
            </p>
        </div>
        
        {trainings.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 text-lg">Nenhum treino disponível.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {trainings.map((training) => (
              <Link 
                to={`/training/${training.firestoreId}`} 
                key={training.firestoreId} 
                className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                      {/* Ícone Novo */}
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-gray-700 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <DumbbellIcon className="w-6 h-6" />
                      </div>
                      
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${getDifficultyColor(training.difficulty)}`}>
                          {training.difficulty}
                      </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                      {training.name}
                  </h3>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 h-10 leading-relaxed">
                      {training.description || "Treino focado em resultados."}
                  </p>

                  <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                          <span>📋 {training.exercises?.length || 0} Exercícios</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                          Ver Detalhes <span>→</span>
                      </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}