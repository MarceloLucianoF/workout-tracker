import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuthContext } from '../../hooks/AuthContext';
import toast from 'react-hot-toast';

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
        // Fallback se faltar índice
        try {
            const qFallback = query(collection(db, 'checkIns'), where('userId', '==', user.uid));
            const snap = await getDocs(qFallback);
            const data = snap.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
            data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setHistory(data);
        } catch (err2) {
            toast.error('Erro ao carregar histórico.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchHistory();
    }
  }, [user]);

  const handleDelete = async (itemId) => {
    if (window.confirm('Deseja apagar este registro do histórico?')) {
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
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Data desconhecida';
    return new Date(isoString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto pb-20">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Histórico de Treinos 📅</h1>

        {history.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-6xl mb-4">💤</p>
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Nenhum treino registrado</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Complete seu primeiro treino para vê-lo aqui!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div 
                key={item.firestoreId} 
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all border-l-4 border-green-500 flex justify-between items-center group"
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                    {item.trainingName || 'Treino Sem Nome'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(item.date)}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 mt-3 text-sm">
                    <span className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded">
                      ⏱️ {formatDuration(item.duration)}
                    </span>
                    
                    {/* LÓGICA HÍBRIDA: Se tiver 'totalSetsDone' (Novo) mostra séries. Se não, mostra exercícios (Antigo) */}
                    {item.totalSetsDone !== undefined ? (
                        <>
                            <span className="flex items-center text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                🔥 {item.totalSetsDone} Séries Feitas
                            </span>
                            {item.totalVolume > 0 && (
                                <span className="flex items-center text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
                                    🏋️ {item.totalVolume}kg Volume
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded">
                            ✅ {item.completedExercises?.length || 0} / {item.totalExercises || 0} exercícios
                        </span>
                    )}
                  </div>
                </div>

                <button 
                    onClick={() => handleDelete(item.firestoreId)}
                    className="text-gray-300 hover:text-red-500 p-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Apagar registro"
                >
                    🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}