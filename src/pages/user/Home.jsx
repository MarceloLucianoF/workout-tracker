import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../hooks/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import WeeklyChart from '../../components/dashboard/WeeklyChart';

export default function Home() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalTreinos: 0, minutosTotal: 0 });

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        if (!user) return;

        // Busca histórico completo (para estatísticas)
        const q = query(
          collection(db, 'checkIns'), 
          where('userId', '==', user.uid),
          orderBy('date', 'desc') // Ordenar por data
        );
        
        // NOTA: Se der erro de índice no console, o Firebase vai gerar um link.
        // Clique nele para criar o índice composto automaticamente.
        
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(d => d.data());

        setHistory(data);

        // Calcula totais
        const totalMinutos = data.reduce((acc, curr) => acc + (curr.duration || 0), 0);
        setStats({
          totalTreinos: data.length,
          minutosTotal: Math.floor(totalMinutos / 60)
        });

      } catch (error) {
        console.error("Erro ao carregar home:", error);
        // Fallback silencioso (busca sem ordenação se falhar índice)
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [user]);

  // Saudação baseada no horário
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header de Boas Vindas */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-xl">
          <div>
            <p className="text-blue-200 text-sm font-medium uppercase tracking-wider mb-1">{getGreeting()}</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {user.displayName || 'Atleta'}! 💪
            </h1>
            <p className="text-blue-100 opacity-90 max-w-md">
              "O único treino ruim é aquele que não aconteceu." Vamos treinar hoje?
            </p>
          </div>
          
          <button 
            onClick={() => navigate('/trainings')}
            className="mt-6 md:mt-0 bg-white text-blue-700 px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
          >
            <span>🔥</span> Começar Treino
          </button>
        </div>

        {/* Grid de Stats e Gráfico */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card Esquerda: Estatísticas Rápidas */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl">
                ✅
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Treinos Feitos</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalTreinos}</h3>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-2xl">
                ⏱️
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Minutos Totais</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{stats.minutosTotal}</h3>
              </div>
            </div>
          </div>

          {/* Card Direita: Gráfico Semanal (Ocupa 2 colunas) */}
          <div className="md:col-span-2">
            <WeeklyChart history={history} />
          </div>
        </div>

        {/* Última Atividade */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Última Atividade</h2>
          {history.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer" onClick={() => navigate('/history')}>
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg text-2xl">🏋️‍♂️</div>
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-white">{history[0].trainingName}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(history[0].date).toLocaleDateString('pt-BR')} • {Math.floor(history[0].duration / 60)} min
                  </p>
                </div>
              </div>
              <span className="text-gray-400 text-2xl">→</span>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-600">
              <p className="text-gray-500 dark:text-gray-400">Nenhuma atividade recente.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}