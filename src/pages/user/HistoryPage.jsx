// src/pages/user/HistoryPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../hooks/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export default function HistoryPage() {
  const { user } = useAuthContext();
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCheckIns = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, 'checkIns'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCheckIns(data);
      } catch (err) {
        setError(err.message);
        console.error("Erro ao buscar histórico:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCheckIns();
    }
  }, [user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <p className="text-gray-600 dark:text-gray-300 text-lg">Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-8">Histórico de Treinos</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 px-4 py-3 rounded mb-6">
            Erro ao carregar histórico: {error}
          </div>
        )}

        {checkIns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">Nenhum treino realizado ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {checkIns.map(checkIn => (
              <div key={checkIn.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300 border border-transparent dark:border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{checkIn.trainingName}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{formatDate(checkIn.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {checkIn.completedExercises?.length || 0}/{checkIn.totalExercises}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">exercícios completos</p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.round((checkIn.completedExercises?.length || 0) / checkIn.totalExercises * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}