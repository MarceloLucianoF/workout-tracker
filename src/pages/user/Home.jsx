import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../../hooks/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import WeeklyChart from '../../components/dashboard/WeeklyChart'; // <--- Import do novo componente

export default function Home() {
  const { user } = useAuthContext();
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastWorkout, setLastWorkout] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // 1. Define o intervalo da semana atual (Domingo a Sábado)
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Volta para Domingo
        startOfWeek.setHours(0, 0, 0, 0);

        // 2. Busca Check-ins
        const q = query(
          collection(db, 'checkIns'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );

        const snapshot = await getDocs(q);
        const checkIns = snapshot.docs.map(doc => ({
          ...doc.data(),
          dateObj: new Date(doc.data().date)
        }));

        // 3. Pega o último treino para mostrar no card
        if (checkIns.length > 0) {
          setLastWorkout(checkIns[0]);
        }

        // 4. Processa dados para o Gráfico (Filtra só desta semana)
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const chartData = days.map((day, index) => {
          const count = checkIns.filter(checkIn => {
            const checkInDate = checkIn.dateObj;
            return checkInDate >= startOfWeek && checkInDate.getDay() === index;
          }).length;
          
          return { day, count };
        });

        setWeeklyData(chartData);

      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-blue-600 dark:bg-blue-900 text-white p-6 rounded-2xl shadow-lg transition-colors duration-300">
        <div>
          <h1 className="text-3xl font-bold">
            Olá, {user.displayName || user.email.split('@')[0]}! 👋
          </h1>
          <p className="opacity-90 mt-1">
            {lastWorkout 
              ? `Último treino: ${lastWorkout.trainingName} (${new Date(lastWorkout.date).toLocaleDateString()})` 
              : 'Vamos começar seu primeiro treino hoje?'}
          </p>
        </div>
        <Link 
          to="/trainings" 
          className="mt-4 md:mt-0 bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition transform hover:-translate-y-1 shadow-md"
        >
          Começar Treino 🏋️
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal: Gráfico (Ocupa 2 espaços no Desktop) */}
        <div className="lg:col-span-2">
           {loading ? (
             <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
           ) : (
             <WeeklyChart data={weeklyData} />
           )}
        </div>

        {/* Coluna Lateral: Resumo Rápido */}
        <div className="space-y-6">
          {/* Card Histórico */}
          <Link to="/history" className="block group">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">📊</span>
                <span className="text-green-500 font-bold text-sm">VER TODOS</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Seu Histórico</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Total de {weeklyData.reduce((acc, curr) => acc + curr.count, 0)} treinos esta semana
              </p>
            </div>
          </Link>

          {/* Card Perfil */}
          <Link to="/profile" className="block group">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">👤</span>
                <span className="text-purple-500 font-bold text-sm">EDITAR</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Meu Perfil</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Atualize seu peso e metas</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}