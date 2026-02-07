import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../hooks/AuthContext';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import WeeklyChart from '../../components/dashboard/WeeklyChart';

export default function Home() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados do Game e Stats
  const [stats, setStats] = useState({ 
    totalTreinos: 0, 
    totalVolume: 0, // Carga total levantada
    totalSets: 0,   // Séries totais
    streak: 0,
    level: 'Iniciante',
    nextLevelTreinos: 10,
    progress: 0
  });

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        if (!user) return;

        // 1. Busca Perfil (Peso, Altura, Meta)
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            setUserProfile(userDoc.data());
        }

        // 2. Busca Histórico
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
        console.error("Erro ao carregar home:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [user]);

  // 🧠 Lógica de Gamification & Stats Avançados
  const calculateGamification = (data) => {
    // 1. Totais
    const totalTreinos = data.length;
    
    // Soma Volume (kg) e Séries
    let volumeAcumulado = 0;
    let setsAcumulados = 0;

    data.forEach(treino => {
        volumeAcumulado += (treino.totalVolume || 0);
        setsAcumulados += (treino.totalSetsDone || 0);
    });

    // 2. Cálculo de Nível (RPG Style)
    let level = 'Iniciante';
    let nextLevelTreinos = 10;
    
    if (totalTreinos >= 100) { level = 'Lenda 👑'; nextLevelTreinos = 1000; }
    else if (totalTreinos >= 50) { level = 'Monstro 🦍'; nextLevelTreinos = 100; }
    else if (totalTreinos >= 25) { level = 'Atleta 🏃'; nextLevelTreinos = 50; }
    else if (totalTreinos >= 10) { level = 'Focado 🧠'; nextLevelTreinos = 25; }

    let base = 0;
    if (level === 'Focado 🧠') base = 10;
    if (level === 'Atleta 🏃') base = 25;
    if (level === 'Monstro 🦍') base = 50;
    
    const progress = Math.min(100, Math.max(0, ((totalTreinos - base) / (nextLevelTreinos - base)) * 100));

    // 3. Cálculo de Streak (Dias Consecutivos)
    const today = new Date().setHours(0,0,0,0);
    const uniqueDates = [...new Set(data.map(d => new Date(d.date).setHours(0,0,0,0)))]; 
    
    // Conta streak reverso
    const sortedUnique = uniqueDates.sort((a,b) => b - a);
    let streakCount = 0;
    
    if (sortedUnique.length > 0) {
        const lastWorkout = sortedUnique[0];
        const diffDays = (today - lastWorkout) / (1000 * 60 * 60 * 24);
        
        // Se treinou hoje ou ontem, o streak está vivo
        if (diffDays <= 1) {
            streakCount = 1;
            for (let i = 0; i < sortedUnique.length - 1; i++) {
                const curr = sortedUnique[i];
                const prev = sortedUnique[i+1];
                const diff = (curr - prev) / (1000 * 60 * 60 * 24);
                if (diff === 1) streakCount++;
                else break;
            }
        }
    }

    setStats({
      totalTreinos,
      totalVolume: volumeAcumulado,
      totalSets: setsAcumulados,
      level,
      nextLevelTreinos,
      progress,
      streak: streakCount
    });
  };

  const formatVolume = (kg) => {
      if (kg > 1000) return `${(kg / 1000).toFixed(1)} ton`;
      return `${kg} kg`;
  };

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300 pb-24">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header de Boas Vindas + Nível */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 relative overflow-hidden">
          {/* Background decorativo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1">
              <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">{getGreeting()}</p>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
                        {user.displayName || 'Atleta'}
                    </h1>
                  </div>
                  {userProfile?.goal && (
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold px-3 py-1 rounded-full border border-green-200 dark:border-green-800 uppercase">
                          Meta: {userProfile.goal}
                      </span>
                  )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-blue-200 dark:border-blue-800">
                  Nível: {stats.level}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.totalTreinos} / {stats.nextLevelTreinos} para upar
                </span>
              </div>
              
              {/* Barra de XP */}
              <div className="w-full max-w-md h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${stats.progress}%` }}
                ></div>
              </div>
            </div>

            <button 
              onClick={() => navigate('/trainings')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-600/20 transform hover:scale-105 transition-all flex items-center gap-3"
            >
              <span className="text-xl">💪</span> 
              <span>TREINAR AGORA</span>
            </button>
          </div>
        </div>

        {/* Grid de Stats com Gamification */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card Ofensiva (Streak) */}
          <div className="bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-20 text-6xl transform rotate-12 group-hover:scale-110 transition-transform">🔥</div>
            <p className="text-orange-100 text-sm font-medium uppercase">Ofensiva</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-4xl font-bold">{stats.streak}</h3>
              <span className="text-sm opacity-90">dias seguidos</span>
            </div>
            <p className="text-xs mt-3 text-orange-100 opacity-80">
              {stats.streak > 0 ? "O fogo está aceso! 🔥" : "Treine hoje para começar!"}
            </p>
          </div>

          {/* Card Volume Total */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl transform -rotate-12">🏋️</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase">Carga Total</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-3xl font-bold text-gray-800 dark:text-white truncate">
                  {formatVolume(stats.totalVolume)}
              </h3>
            </div>
            <p className="text-xs mt-3 text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
              <span>📊</span> {stats.totalSets} séries concluídas
            </p>
          </div>

          {/* Card Shape / Perfil (ATUALIZADO PARA MEDIDAS) */}
          <div 
             onClick={() => navigate('/measurements')}
             className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl transform rotate-12 group-hover:scale-110 transition-transform">⚖️</div>
            
            <div className="flex justify-between items-start">
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase">Seu Físico</p>
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-[10px] font-bold px-2 py-1 rounded uppercase">
                    Ver Evolução
                </span>
            </div>
            
            {userProfile?.weight ? (
                <>
                    <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{userProfile.weight}kg</h3>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between text-blue-600 dark:text-blue-400">
                        <span className="text-xs font-bold">Registrar nova medida</span>
                        <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                </>
            ) : (
                <div className="mt-4">
                    <p className="text-gray-800 dark:text-white font-bold">Começar Jornada</p>
                    <p className="text-xs text-gray-500 mb-2">Registre seu peso inicial</p>
                    <span className="text-blue-600 text-xs font-bold">Configurar agora →</span>
                </div>
            )}
          </div>
        </div>

        {/* Gráfico Semanal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WeeklyChart history={history} />
          </div>
          
          {/* Última Atividade Detalhada */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4">Último Treino</h3>
            
            {history.length > 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-3xl mb-3">
                  💪
                </div>
                <h4 className="font-bold text-gray-800 dark:text-white text-lg line-clamp-1">{history[0].trainingName}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {new Date(history[0].date).toLocaleDateString('pt-BR')}
                </p>
                
                {/* Stats do Último Treino */}
                <div className="flex gap-3 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 px-3 py-2 rounded-lg mb-4">
                    <span>⏱️ {Math.floor(history[0].duration / 60)}min</span>
                    {history[0].totalVolume > 0 && (
                        <span>🏋️ {history[0].totalVolume}kg</span>
                    )}
                </div>

                <button 
                  onClick={() => navigate('/history')}
                  className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline"
                >
                  Ver histórico completo →
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                Nada por aqui ainda.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}