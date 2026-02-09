import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../hooks/AuthContext';
import { collection, query, where, getDocs, orderBy, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import WeeklyChart from '../../components/dashboard/WeeklyChart';

// --- SUB-COMPONENTES (Para manter o código limpo) ---

// 1. Card de Recomendação Inteligente
const RecommendedWorkoutCard = ({ lastWorkoutId, trainings, onStart }) => {
  // Lógica: Encontra o último feito e sugere o próximo, ou roda A se acabou a lista
  let nextTraining = null;
  
  if (trainings.length > 0) {
      if (lastWorkoutId) {
          const lastIndex = trainings.findIndex(t => t.firestoreId === lastWorkoutId);
          // Se achou e não é o último, pega o próximo. Se é o último ou não achou, pega o primeiro.
          if (lastIndex !== -1 && lastIndex < trainings.length - 1) {
              nextTraining = trainings[lastIndex + 1];
          } else {
              nextTraining = trainings[0];
          }
      } else {
          nextTraining = trainings[0]; // Usuário novo começa pelo primeiro
      }
  }

  if (!nextTraining) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 shadow-lg shadow-blue-600/20 text-white relative overflow-hidden mb-8 group">
        {/* Background Decorativo */}
        <div className="absolute top-0 right-0 opacity-10 text-9xl transform translate-x-10 -translate-y-4 pointer-events-none group-hover:scale-110 transition-transform duration-700">🔥</div>
        
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
                <span className="bg-white/20 backdrop-blur-md text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                    Recomendado Hoje
                </span>
                <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">
                    • {nextTraining.difficulty}
                </span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black mb-1">{nextTraining.name}</h2>
            <p className="text-blue-100 text-sm mb-6 max-w-md line-clamp-1 opacity-90">
                {nextTraining.description || "Foco total no progresso e consistência."}
            </p>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <button 
                    onClick={() => onStart(nextTraining.firestoreId)}
                    className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 hover:bg-blue-50"
                >
                    <span>▶</span> Iniciar Agora
                </button>
                <div className="text-xs font-bold text-blue-100 flex items-center gap-3">
                    <span className="flex items-center gap-1">⏱ ~45 min</span>
                    <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                    <span className="flex items-center gap-1">📋 {nextTraining.exercises?.length || 0} Exercícios</span>
                </div>
            </div>
        </div>
    </div>
  );
};

// 2. Card de Consistência (Psicológico)
const ConsistencyCard = ({ history }) => {
    // Calcula treinos nos últimos 14 dias
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const recentWorkouts = history.filter(h => new Date(h.date) >= twoWeeksAgo).length;
    
    let status = "Começando 🚀";
    let color = "text-blue-500";
    
    if(recentWorkouts >= 8) { status = "Imparável 🔥"; color = "text-orange-500"; }
    else if(recentWorkouts >= 4) { status = "Constante 💪"; color = "text-green-500"; }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Consistência (14 dias)</h3>
                <span className={`text-[10px] font-bold ${color} bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded`}>{status}</span>
            </div>
            <div className="flex items-end gap-1 mt-2">
                <span className="text-4xl font-black text-gray-800 dark:text-white">{recentWorkouts}</span>
                <span className="text-sm text-gray-400 font-bold mb-1">treinos</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Mantenha o ritmo para evoluir.</p>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---

export default function Home() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  
  const [history, setHistory] = useState([]);
  const [trainings, setTrainings] = useState([]); // Lista de treinos disponíveis
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Stats
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

        // 2. Histórico Completo
        const qHistory = query(
          collection(db, 'checkIns'), 
          where('userId', '==', user.uid),
          orderBy('date', 'desc')
        );
        const historySnap = await getDocs(qHistory);
        const historyData = historySnap.docs.map(d => d.data());
        setHistory(historyData);
        calculateGamification(historyData);

        // 3. Treinos Disponíveis (Para recomendação)
        // Ordenamos por nome para ter uma sequência lógica (A, B, C...)
        const qTrainings = query(collection(db, 'trainings'), orderBy('name', 'asc')); 
        const trainingSnap = await getDocs(qTrainings);
        const trainingList = trainingSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
        setTrainings(trainingList);

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
    const volumeAcumulado = data.reduce((acc, curr) => acc + (Number(curr.totalVolume) || 0), 0);

    // Sistema de Níveis RPG
    let level = 'Iniciante 🌱';
    let nextLevel = 10;
    
    if (totalTreinos >= 100) { level = 'Lenda 👑'; nextLevel = 1000; }
    else if (totalTreinos >= 50) { level = 'Monstro 🦍'; nextLevel = 100; }
    else if (totalTreinos >= 25) { level = 'Atleta 🏃'; nextLevel = 50; }
    else if (totalTreinos >= 10) { level = 'Focado 🧠'; nextLevel = 25; }

    let base = 0;
    if (totalTreinos >= 10) base = 10;
    if (totalTreinos >= 25) base = 25;
    if (totalTreinos >= 50) base = 50;
    
    const progress = Math.min(100, Math.max(0, ((totalTreinos - base) / (nextLevel - base)) * 100));

    // Cálculo de Streak
    const uniqueDates = [...new Set(data.map(d => new Date(d.date).toISOString().split('T')[0]))].sort().reverse();
    let streak = 0;
    if (uniqueDates.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
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

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div></div>;

  const firstName = (userProfile?.displayName || user?.displayName || 'Atleta').split(' ')[0];
  const photoURL = userProfile?.photoURL || user?.photoURL;
  
  // Pega o ID do último treino feito para lógica de recomendação
  const lastWorkoutId = history.length > 0 ? history[0].trainingId : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors duration-300 pb-32">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* 1. Header Minimalista */}
        <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-3">
                <div onClick={() => navigate('/profile')} className="w-12 h-12 rounded-full overflow-hidden shadow-sm border-2 border-white dark:border-gray-700 cursor-pointer hover:opacity-80 transition-opacity">
                    {photoURL ? (
                        <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {firstName[0]}
                        </div>
                    )}
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">Olá, {firstName}!</h1>
                    <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1 uppercase tracking-wider">
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">{stats.level}</span>
                    </div>
                </div>
            </div>
            
            {/* Streak Badge */}
            <div className="text-center bg-white dark:bg-gray-800 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="text-xl">🔥</div>
                <div className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase">{stats.streak} dias</div>
            </div>
        </div>

        {/* 2. PRODUTO: Recomendação Inteligente */}
        <RecommendedWorkoutCard 
            lastWorkoutId={lastWorkoutId} 
            trainings={trainings} 
            onStart={(id) => navigate(`/training/${id}`)}
        />

        {/* 3. Grid de KPIs Psicológicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Próxima Meta */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:border-blue-200 transition-colors">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">Próxima Meta 🎯</h3>
                <div className="flex justify-between items-end mb-2">
                    <span className="text-3xl font-black text-gray-800 dark:text-white">{stats.nextLevelTreinos}</span>
                    <span className="text-xs font-bold text-gray-400 mb-1">treinos</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${stats.progress}%` }}></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-right">Faltam {stats.nextLevelTreinos - stats.totalTreinos}</p>
            </div>

            <ConsistencyCard history={history} />

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">Volume Total</h3>
                <div className="flex items-end gap-1 mt-2">
                    <span className="text-3xl font-black text-gray-800 dark:text-white">{formatVolume(stats.totalVolume)}</span>
                </div>
                <p className="text-[10px] text-purple-500 mt-2 font-bold bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded inline-block">Levantados até hoje</p>
            </div>

            <div 
                onClick={() => navigate('/measurements')}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-300 transition-colors group"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">Peso Corporal</h3>
                        <span className="text-3xl font-black text-gray-800 dark:text-white">{userProfile?.weight || '--'}kg</span>
                    </div>
                    <span className="text-2xl group-hover:scale-110 transition-transform">⚖️</span>
                </div>
                <p className="text-[10px] text-blue-500 mt-2 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Atualizar medidas →</p>
            </div>
        </div>

        {/* 4. Gráfico e Última Conquista */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <div className="mb-4 flex items-center justify-between px-1">
                    <h3 className="font-bold text-gray-700 dark:text-white text-lg">Frequência Semanal</h3>
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">Mantenha o foco!</span>
                </div>
                <WeeklyChart history={history} />
            </div>

            {/* Resumo Rico da Última Atividade */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-6">Última Conquista</h3>
                
                {history.length > 0 ? (
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                                🏆
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-gray-800 dark:text-white leading-tight line-clamp-1">
                                    {history[0].trainingName}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                                    {new Date(history[0].date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                        </div>

                        {/* Mini Stats Detalhados */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                                <p className="text-[9px] text-gray-400 uppercase font-bold">Tempo</p>
                                <p className="font-mono font-bold text-gray-800 dark:text-white text-lg">{Math.floor(history[0].duration / 60)}<span className="text-xs ml-0.5">min</span></p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                                <p className="text-[9px] text-gray-400 uppercase font-bold">Volume</p>
                                <p className="font-mono font-bold text-gray-800 dark:text-white text-lg">{formatVolume(history[0].totalVolume)}</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => navigate('/history')}
                            className="w-full mt-auto py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs uppercase tracking-wide"
                        >
                            Ver Histórico Completo
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col justify-center items-center text-center py-8 text-gray-400">
                        <div className="text-4xl mb-3 opacity-50">💤</div>
                        <p className="text-sm font-medium">Nenhum treino ainda.</p>
                        <button onClick={() => navigate('/trainings')} className="text-blue-500 font-bold text-xs mt-2 hover:underline">Começar Jornada</button>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}