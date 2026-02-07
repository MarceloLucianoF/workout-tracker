import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuthContext } from '../../hooks/AuthContext';
import toast from 'react-hot-toast';
import MonthCalendar from '../../components/dashboard/MonthCalendar'; // Importe o calendário

export default function HistoryPage() {
  const { user } = useAuthContext();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, 'checkIns'),
          where('userId', '==', user.uid),
          orderBy('date', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          firestoreId: doc.id,
          ...doc.data()
        }));

        setHistory(data);
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        // Fallback básico
        toast.error('Erro ao carregar histórico.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchHistory();
    }
  }, [user]);

  const handleDelete = async (itemId) => {
    if (window.confirm('Tem certeza que deseja apagar este treino do histórico?')) {
        try {
            await deleteDoc(doc(db, 'checkIns', itemId));
            setHistory(prev => prev.filter(item => item.firestoreId !== itemId));
            toast.success('Registro apagado.');
        } catch (error) {
            toast.error('Erro ao apagar.');
        }
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0min';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Data desconhecida';
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Diário de Treinos 📅</h1>

        {/* 1. Calendário de Frequência */}
        <MonthCalendar history={history} />

        <h2 className="text-xl font-bold text-gray-700 dark:text-white mb-4 pl-1">Atividades Recentes</h2>

        {history.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-6xl mb-4 opacity-50">💤</p>
            <h3 className="text-xl font-bold text-gray-700 dark:text-white">Nenhum treino registrado</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Seu calendário está esperando por você!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => {
                const dateObj = formatDate(item.date);
                
                return (
                  <div 
                    key={item.firestoreId} 
                    className="bg-white dark:bg-gray-800 rounded-2xl p-0 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 overflow-hidden group relative"
                  >
                    <div className="p-5 flex gap-5">
                        
                        {/* Coluna da Data (Estilo Bloco) */}
                        <div className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700/50 rounded-xl min-w-[70px] h-[70px]">
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{dateObj.month}</span>
                            <span className="text-2xl font-black text-gray-800 dark:text-white leading-none">{dateObj.day}</span>
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">
                                {item.trainingName || 'Treino Sem Nome'}
                            </h3>
                            <p className="text-xs text-gray-400 capitalize mb-3">
                                {dateObj.full}
                            </p>
                            
                            {/* Badges de Stats */}
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
                                        🔥 {item.totalSetsDone} Séries
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Botão de Delete (Só aparece no Hover ou Mobile via layout) */}
                    <button 
                        onClick={() => handleDelete(item.firestoreId)}
                        className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Apagar registro"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                );
            })}
          </div>
        )}
      </div>
    </div>
  );
}