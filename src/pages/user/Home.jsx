import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../hooks/AuthContext';
import { collection, query, where, getDocs, orderBy, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import WeeklyChart from '../../components/dashboard/WeeklyChart';

export default function Home() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Stats Calculados
  const [stats, setStats] = useState({ 
    totalTreinos: 0, 
    totalVolume: 0,
    streak: 0,
    level: 'Iniciante',
    nextLevelTreinos: 10,
    progress: 0
  });

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        if (!user) return;

        // 1. Perfil
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) setUserProfile(userDoc.data());

        // 2. Histórico Completo (Para totais)
        const q = query(
          collection(db, 'checkIns'), 
          where('userId', '==', user.uid),
          orderBy('date', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(d => d.data());

        setHistory(data);
        calculateGamification(data);

      } catch (error) {
        console.error("Erro Home:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [user]);

  const calculateGamification = (data) => {
    const totalTreinos = data.length;
    
    // Soma Volume Total (Tonelagem)
    const volumeAcumulado = data.reduce((acc, curr) => acc + (Number(curr.totalVolume) || 0), 0);

    // Sistema de Níveis RPG
    let level = 'Iniciante 🌱';
    let nextLevel = 10;
    
    if (totalTreinos >= 100) { level = 'Lenda 👑'; nextLevel = 1000; }
    else if (totalTreinos >= 50) { level = 'Monstro 🦍'; nextLevel = 100; }
    else if (totalTreinos >= 25) { level = 'Atleta 🏃'; nextLevel = 50; }
    else if (totalTreinos >= 10) { level = 'Focado 🧠'; nextLevel = 25; }

    // Calcula base do nível anterior para a barra de progresso não começar do zero absoluto
    let base = 0;
    if (totalTreinos >= 10) base = 10;
    if (totalTreinos >= 25) base = 25;
    if (totalTreinos >= 50) base = 50;
    
    const progress = Math.min(100, Math.max(0, ((totalTreinos - base) / (nextLevel - base)) * 100));

    // Cálculo de Streak (Dias Consecutivos)
    const uniqueDates = [...new Set(data.map(d => new Date(d.date).toISOString().split('T')[0]))].sort().reverse();
    let streak = 0;
    
    if (uniqueDates.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        // Se o último treino foi hoje ou ontem, o streak está vivo
        if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
            streak = 1;
            for (let i = 0; i < uniqueDates.length - 1; i++) {
                const curr = new Date(uniqueDates[i]);
                const prev = new Date(uniqueDates[i+1]);
                const diffTime = Math.abs(curr - prev);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                if (diffDays === 1) streak++;
                else break;
            }
        }
    }

    setStats({
      totalTreinos,
      totalVolume: volumeAcumulado,
      level,
      nextLevelTreinos: nextLevel,
      progress,
      streak
    });
  };

  const formatVolume = (kg) => {
      if (kg > 1000) return `${(kg / 1000).toFixed(1)}t`;
      return `${kg}kg`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors duration-300 pb-32">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Principal */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20 text-white font-bold">
                    {user.displayName?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Olá, {user.displayName?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Vamos superar seus limites hoje?</p>
                </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex-1 md:flex-initial">
                    <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                        <span>Nível: {stats.level}</span>
                        <span>{stats.totalTreinos}/{stats.nextLevelTreinos}</span>
                    </div>
                    <div className="w-full md:w-48 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                            style={{ width: `${stats.progress}%` }}
                        ></div>
                    </div>
                </div>
                
                <button 
                    onClick={() => navigate('/trainings')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all whitespace-nowrap"
                >
                    Treinar 🔥
                </button>
            </div>
        </div>

        {/* Grid de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card Streak */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 text-6xl opacity-20 transform rotate-12 group-hover:scale-110 transition-transform">🔥</div>
                <p className="text-orange-100 text-xs font-bold uppercase tracking-wider">Ofensiva</p>
                <h3 className="text-4xl font-black mt-1">{stats.streak} <span className="text-lg font-medium opacity-80">dias</span></h3>
                <p className="text-xs text-orange-50 mt-2 opacity-80">Mantenha o foco!</p>
            </div>

            {/* Card Volume */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Carga Total</p>
                        <h3 className="text-3xl font-black text-gray-800 dark:text-white mt-1">{formatVolume(stats.totalVolume)}</h3>
                    </div>
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600 dark:text-purple-400">⚡</div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Levantados em sua jornada</p>
            </div>

            {/* Card Treinos */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Missões</p>
                        <h3 className="text-3xl font-black text-gray-800 dark:text-white mt-1">{stats.totalTreinos}</h3>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">✅</div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Treinos concluídos com sucesso</p>
            </div>

            {/* Card Perfil/Peso */}
            <div 
                onClick={() => navigate('/measurements')}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-300 transition-colors group"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Peso Atual</p>
                        <h3 className="text-3xl font-black text-gray-800 dark:text-white mt-1">
                            {userProfile?.weight ? `${userProfile.weight}kg` : '--'}
                        </h3>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600 dark:text-green-400">⚖️</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-500 mt-2 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Atualizar medidas →
                </div>
            </div>
        </div>

        {/* Área Principal Grid (Gráfico + Última Atividade) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-full">
                <WeeklyChart history={history} />
            </div>

            {/* Última Atividade */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                    Última Conquista
                </h3>
                
                {history.length > 0 ? (
                    <div className="flex-1 flex flex-col justify-center items-center text-center py-4">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-4xl mb-4 animate-bounce-slow">
                            🏆
                        </div>
                        <h4 className="font-bold text-xl text-gray-800 dark:text-white mb-1">
                            {history[0].trainingName}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            {new Date(history[0].date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        
                        <button 
                            onClick={() => navigate('/history')}
                            className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Ver Histórico Completo
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col justify-center items-center text-center py-8 text-gray-400">
                        <div className="text-4xl mb-2">💤</div>
                        <p>Nenhum treino registrado ainda.</p>
                        <p className="text-xs mt-2">Bora começar hoje?</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}