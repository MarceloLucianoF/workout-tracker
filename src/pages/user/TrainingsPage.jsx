import React from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';

export default function TrainingsPage() {
  const { trainings, loading, error } = useAdmin();

  // Função para extrair a letra do treino (A, B, C...) ou usar ícone padrão
  const getTrainingLetter = (name) => {
    const match = name.match(/Treino\s+([A-Z])/i);
    return match ? match[1].toUpperCase() : '💪';
  };

  // Cores baseadas na dificuldade
  const getDifficultyColor = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'iniciante': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'intermediário': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'avançado': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Gradiente do Card baseado na letra (para variar as cores visualmente)
  const getGradient = (letter) => {
    const map = {
        'A': 'from-blue-500 to-cyan-400',
        'B': 'from-purple-500 to-pink-500',
        'C': 'from-orange-500 to-red-500',
        'D': 'from-emerald-500 to-green-400',
        'E': 'from-indigo-500 to-blue-600'
    };
    return map[letter] || 'from-gray-700 to-gray-900';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-red-500">
        Erro: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300 pb-24">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">
                    Fichas de Treino 🏋️
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Escolha sua missão de hoje.
                </p>
            </div>
            
            {/* Opcional: Filtros futuros poderiam entrar aqui */}
            <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm text-xs font-bold text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
                {trainings.length} Treinos Disponíveis
            </div>
        </div>
        
        {trainings.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 text-lg">Nenhum treino cadastrado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trainings.map((training) => {
              const letter = getTrainingLetter(training.name);
              const gradient = getGradient(letter);

              return (
                <div 
                  key={training.firestoreId} 
                  className="bg-white dark:bg-gray-800 rounded-3xl p-1 shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100 dark:border-gray-700 relative overflow-hidden"
                >
                  <div className="relative bg-white dark:bg-gray-800 rounded-[22px] p-6 h-full flex flex-col z-10">
                    
                    {/* Header do Card */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                            {/* Avatar da Letra */}
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform`}>
                                {letter}
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white leading-tight line-clamp-1" title={training.name}>
                                    {training.name}
                                </h3>
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border mt-1 ${getDifficultyColor(training.difficulty)}`}>
                                    {training.difficulty}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Descrição */}
                    <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-6 flex-1">
                        {training.description}
                    </p>

                    {/* Footer com Stats e Botão */}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase">
                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                📋 {training.exercises?.length || 0} Exercícios
                            </span>
                        </div>

                        <Link 
                            to={`/training/${training.firestoreId}`} 
                            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-blue-600 dark:hover:bg-blue-400 hover:text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all transform active:scale-95 shadow-lg shadow-gray-200 dark:shadow-none flex items-center gap-2"
                        >
                            Iniciar <span>▶️</span>
                        </Link>
                    </div>
                  </div>
                  
                  {/* Efeito de Fundo (Glow) */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 blur-3xl rounded-full transform translate-x-10 -translate-y-10 group-hover:opacity-20 transition-opacity`}></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}