import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuthContext } from '../../hooks/AuthContext';

// --- COMPONENTES VISUAIS ---

// 1. Skeleton Loading (Carregamento Premium)
const TrainingSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 h-48 border border-gray-100 dark:border-gray-700 animate-pulse flex flex-col justify-between">
    <div className="flex justify-between">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
      <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
    </div>
    <div className="space-y-2">
      <div className="w-3/4 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
    <div className="w-full h-px bg-gray-100 dark:bg-gray-700"></div>
    <div className="flex justify-between">
      <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);

// 2. Chip de Filtro
const FilterChip = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
      active 
      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' 
      : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-400'
    }`}
  >
    {label}
  </button>
);

export default function TrainingsPage() {
  const { trainings, loading: loadingTrainings, error } = useAdmin();
  const { user } = useAuthContext();
  
  // States Locais
  const [historyMap, setHistoryMap] = useState({}); // { trainingId: lastDate }
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [filter, setFilter] = useState('Todos');

  // 1. Busca Histórico do Usuário para dar inteligência
  useEffect(() => {
    const fetchUserHistory = async () => {
      if (!user) return;
      try {
        const q = query(
            collection(db, 'checkIns'), 
            where('userId', '==', user.uid),
            orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        
        const history = {};
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            // Salva apenas a data mais recente de cada treino
            if (data.trainingId && !history[data.trainingId]) {
                history[data.trainingId] = new Date(data.date);
            }
        });
        setHistoryMap(history);
      } catch (err) {
        console.error("Erro history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchUserHistory();
  }, [user]);

  // 2. Lógica Inteligente (Helpers)
  const getTrainingEmoji = (name) => {
    // Tenta detectar pelo nome (mais inteligente que letra)
    const lower = name.toLowerCase();
    if (lower.includes('peito') || lower.includes('superior')) return '🦍';
    if (lower.includes('perna') || lower.includes('inferior')) return '🦵';
    if (lower.includes('costas') || lower.includes('dorsal')) return '🐍';
    if (lower.includes('braço') || lower.includes('bíceps')) return '💪';
    if (lower.includes('cardio') || lower.includes('aeróbico')) return '🏃';
    if (lower.includes('full') || lower.includes('corpo')) return '⚡';

    // Fallback para letra
    const match = name.match(/Treino\s+([A-Z])/i);
    const letter = match ? match[1].toUpperCase() : '';
    const map = { 'A': '🔥', 'B': '⚡', 'C': '💣', 'D': '🧱', 'E': '🚀' };
    return map[letter] || '🏋️';
  };

  const getDifficultyColor = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'iniciante': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'intermediário': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'avançado': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const formatLastDone = (date) => {
      if (!date) return null;
      const diff = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
      if (diff === 0) return 'Hoje';
      if (diff === 1) return 'Ontem';
      if (diff < 7) return `Há ${diff} dias`;
      return date.toLocaleDateString('pt-BR');
  };

  // 3. Processamento e Ordenação
  const isLoading = loadingTrainings || loadingHistory;

  const filteredTrainings = trainings.filter(t => {
      if (filter === 'Todos') return true;
      return t.difficulty?.toLowerCase() === filter.toLowerCase();
  });

  // ORDENAÇÃO INTELIGENTE:
  // 1. Treinos "Recomendados" (Nunca feitos ou feitos há muito tempo) primeiro
  // 2. Treinos feitos recentemente por último (para rotacionar)
  const sortedTrainings = [...filteredTrainings].sort((a, b) => {
      const dateA = historyMap[a.firestoreId] || new Date(0); // 1970 se nunca fez
      const dateB = historyMap[b.firestoreId] || new Date(0);
      return dateA - dateB; // Mais antigo (ou nunca feito) primeiro
  });

  if (error) return <div className="min-h-screen flex items-center justify-center dark:text-white">Erro: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pb-24 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight mb-2">
                Fichas de Treino
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
                Escolha sua missão. Organizado por prioridade para você.
            </p>

            {/* Filtros */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['Todos', 'Iniciante', 'Intermediário', 'Avançado'].map(f => (
                    <FilterChip key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />
                ))}
            </div>
        </div>
        
        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1,2,3,4].map(i => <TrainingSkeleton key={i} />)}
            </div>
        ) : sortedTrainings.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 text-lg">Nenhum treino encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sortedTrainings.map((training) => {
              const lastDate = historyMap[training.firestoreId];
              const lastDoneText = formatLastDone(lastDate);
              const emoji = getTrainingEmoji(training.name);
              
              // Cálculo de Tempo Estimado (Heurística: 5 min por exercício)
              const estimatedTime = (training.exercises?.length || 0) * 5 + 10; 

              return (
                <Link 
                  to={`/training/${training.firestoreId}`} 
                  key={training.firestoreId} 
                  className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-800/80"
                >
                  {/* Badge de Recomendado (Se nunca fez ou fez há +7 dias) */}
                  {(!lastDate || (new Date() - lastDate) / (1000 * 60 * 60 * 24) > 7) && (
                      <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl shadow-lg z-10">
                          RECOMENDADO
                      </div>
                  )}

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform group-hover:bg-white dark:group-hover:bg-gray-600">
                            {emoji}
                        </div>
                        
                        <div className="text-right">
                            <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border mb-1 ${getDifficultyColor(training.difficulty)}`}>
                                {training.difficulty}
                            </span>
                            {/* Inteligência de Produto: Mostra quando fez */}
                            <p className="text-[10px] font-bold text-gray-400 uppercase">
                                {lastDoneText ? `Última: ${lastDoneText}` : 'Nunca realizado'}
                            </p>
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {training.name}
                    </h3>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-5 h-10 leading-relaxed">
                        {training.description || "Foco total no desenvolvimento muscular."}
                    </p>

                    {/* Footer Rico */}
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
                                <span>📋</span> {training.exercises?.length || 0}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
                                <span>⏱️</span> ~{estimatedTime} min
                            </div>
                        </div>
                        
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            ➔
                        </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}