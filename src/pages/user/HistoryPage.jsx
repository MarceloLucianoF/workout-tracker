import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuthContext } from '../../hooks/AuthContext';
import toast from 'react-hot-toast';
import MonthCalendar from '../../components/dashboard/MonthCalendar';
import { useNavigate } from 'react-router-dom';

export default function HistoryPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros Locais
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'month', 'last_month'

  // 1. ARQUITETURA REAL-TIME (onSnapshot)
  useEffect(() => {
    if (!user) return;

    // Query Base
    const q = query(
      collection(db, 'checkIns'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    // Escuta ativa (Websocket)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        firestoreId: doc.id,
        ...doc.data()
      }));
      setHistory(data);
      setLoading(false);
    }, (error) => {
      console.error("Erro realtime:", error);
      toast.error('Erro de conexão com histórico.');
      setLoading(false);
    });

    return () => unsubscribe(); // Limpa listener ao desmontar
  }, [user]);

  // 2. LÓGICA DE FILTRO MEMOIZADA (Performance)
  const filteredHistory = useMemo(() => {
      let filtered = history;

      // Filtro de Texto (Busca profunda em nome do treino E exercícios)
      if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          filtered = filtered.filter(item => 
              (item.trainingName && item.trainingName.toLowerCase().includes(lowerTerm)) ||
              (item.exercises && item.exercises.some(ex => ex.name.toLowerCase().includes(lowerTerm)))
          );
      }

      // Filtro de Tempo
      const now = new Date();
      if (timeFilter === 'month') {
          filtered = filtered.filter(item => {
              const d = new Date(item.date);
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          });
      } else if (timeFilter === 'last_month') {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          filtered = filtered.filter(item => {
              const d = new Date(item.date);
              return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
          });
      }

      return filtered;
  }, [history, searchTerm, timeFilter]);

  // 3. UX DE DELEÇÃO (Toast Custom)
  const handleDeleteRequest = (itemId) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <span className="font-bold text-sm">Apagar este registro?</span>
        <div className="flex gap-2">
            <button 
                onClick={() => {
                    deleteItem(itemId);
                    toast.dismiss(t.id);
                }}
                className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold"
            >
                Confirmar
            </button>
            <button 
                onClick={() => toast.dismiss(t.id)}
                className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-xs font-bold"
            >
                Cancelar
            </button>
        </div>
      </div>
    ), { duration: 4000, icon: '🗑️' });
  };

  const deleteItem = async (itemId) => {
      try {
          await deleteDoc(doc(db, 'checkIns', itemId));
          toast.success('Registro apagado.');
      } catch (error) {
          toast.error('Erro ao apagar.');
      }
  };

  // Helpers de Formatação
  const formatDuration = (seconds) => {
    if (!seconds) return '0min';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return { day: '--', month: '--', full: '' };
    const date = new Date(isoString);
    return {
        day: date.getDate(),
        month: date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase(),
        full: date.toLocaleDateString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300 pb-24">
      <div className="max-w-2xl mx-auto">
        
        {/* Header e Calendário */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Diário de Treinos 📅</h1>
            <MonthCalendar history={history} />
        </div>

        {/* Controles de Filtro e Busca */}
        <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 py-2 mb-4 space-y-3">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Buscar treino ou exercício..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                    />
                </div>
                <select 
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">Tudo</option>
                    <option value="month">Este Mês</option>
                    <option value="last_month">Mês Passado</option>
                </select>
            </div>
            
            {/* Contador de Resultados */}
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                {filteredHistory.length} {filteredHistory.length === 1 ? 'atividade encontrada' : 'atividades encontradas'}
            </div>
        </div>

        {/* Lista de Resultados */}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-4xl mb-4 opacity-50">🕵️‍♂️</p>
            <h3 className="text-lg font-bold text-gray-700 dark:text-white">Nada encontrado</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Tente mudar os filtros.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredHistory.map((item) => {
                const dateObj = formatDate(item.date);
                
                return (
                  <div 
                    key={item.firestoreId} 
                    // ✅ AÇÃO PRINCIPAL: Ir para Detalhes
                    onClick={() => navigate(`/history/${item.firestoreId}`)}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-0 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group relative transition-all hover:shadow-md cursor-pointer"
                  >
                    {/* Header do Card */}
                    <div className="p-5 flex gap-5 border-b border-gray-50 dark:border-gray-700/50">
                        
                        {/* Data Box */}
                        <div className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700/50 rounded-xl min-w-[70px] h-[70px]">
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{dateObj.month}</span>
                            <span className="text-2xl font-black text-gray-800 dark:text-white leading-none">{dateObj.day}</span>
                        </div>

                        {/* Infos Principais */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white leading-tight truncate pr-6">
                                {item.trainingName || 'Treino Sem Nome'}
                            </h3>
                            <p className="text-xs text-gray-400 capitalize mb-3">
                                {dateObj.full}
                            </p>
                            
                            {/* Badges */}
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-2 py-1 rounded text-[10px] font-bold uppercase">
                                    ⏱️ {formatDuration(item.duration)}
                                </span>
                                {item.totalVolume > 0 && (
                                    <span className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 px-2 py-1 rounded text-[10px] font-bold uppercase">
                                        🏋️ {item.totalVolume}kg
                                    </span>
                                )}
                                {item.totalSetsDone !== undefined && (
                                    <span className="inline-flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300 px-2 py-1 rounded text-[10px] font-bold uppercase">
                                        🔥 {item.totalSetsDone} Sets
                                    </span>
                                )}
                            </div>
                        </div>
                        
                         {/* Botão Delete (Com stopPropagation) */}
                         <button 
                            onClick={(e) => {
                                e.stopPropagation(); // 🛑 Evita abrir detalhes ao deletar
                                handleDeleteRequest(item.firestoreId);
                            }}
                            className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Apagar registro"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>

                    {/* Lista Expansível de Exercícios */}
                    {item.exercises && item.exercises.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Detalhes</p>
                            <div className="space-y-2">
                                {item.exercises.map((ex, i) => {
                                    const maxWeight = Math.max(...(ex.sets?.map(s => Number(s.weight) || 0) || [0]));
                                    
                                    return (
                                        <div 
                                            key={i} 
                                            onClick={(e) => {
                                                e.stopPropagation(); // 🛑 Evita abrir detalhes do treino ao clicar no analytics do exercício
                                                navigate(`/analytics/${encodeURIComponent(ex.name)}`);
                                            }}
                                            className="flex justify-between items-center py-2 px-3 bg-white dark:bg-gray-700/40 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer group transition-colors border border-transparent hover:border-blue-200 dark:hover:border-gray-600"
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors truncate">
                                                    {ex.name}
                                                </span>
                                                <span className="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">↗</span>
                                            </div>
                                            
                                            <div className="text-right flex items-center gap-3 shrink-0">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                    {ex.sets?.length || 0} sets
                                                </span>
                                                {maxWeight > 0 && (
                                                    <span className="text-xs font-bold text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded">
                                                        {maxWeight}kg
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                  </div>
                );
            })}
          </div>
        )}
      </div>
    </div>
  );
}