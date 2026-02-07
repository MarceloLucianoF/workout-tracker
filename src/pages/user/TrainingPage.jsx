import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuthContext } from '../../hooks/AuthContext';
import toast from 'react-hot-toast';
import GifPlayer from '../../components/common/GifPlayer';

// --- COMPONENTE DE GRÁFICO SVG (Zero Dependências) ---
const SimpleLineChart = ({ data, color = "#3b82f6" }) => {
  if (!data || data.length < 2) return <div className="text-center text-gray-400 text-xs py-10">Precisa de pelo menos 2 treinos para gerar gráfico.</div>;

  // 1. Normalizar dados
  const maxVal = Math.max(...data.map(d => d.value));
  const minVal = Math.min(...data.map(d => d.value));
  const range = maxVal - minVal || 1; // Evita divisão por zero

  // 2. Configurações SVG
  const width = 300;
  const height = 150;
  const padding = 20;

  // 3. Gerar pontos (Coordenadas X,Y)
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    // Inverte Y porque SVG começa no topo
    const y = height - padding - ((d.value - minVal) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full overflow-hidden">
       <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-lg">
          {/* Linha Guia (Média) */}
          <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
          
          {/* A Linha do Gráfico */}
          <polyline 
             fill="none" 
             stroke={color} 
             strokeWidth="3" 
             points={points} 
             strokeLinecap="round" 
             strokeLinejoin="round"
          />
          
          {/* Pontos (Bolinhas) */}
          {data.map((d, i) => {
             const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
             const y = height - padding - ((d.value - minVal) / range) * (height - 2 * padding);
             return (
               <g key={i} className="group">
                 <circle cx={x} cy={y} r="4" fill="white" stroke={color} strokeWidth="2" />
                 {/* Tooltip simples via title nativo */}
                 <title>{`${d.date}: ${d.value}kg`}</title>
               </g>
             );
          })}
       </svg>
       <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-2">
          <span>{data[0].date}</span>
          <span>{data[data.length-1].date}</span>
       </div>
    </div>
  );
};

export default function TrainingPage() {
  const { trainingId } = useParams();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);
  
  // Estado para Analytics do Exercício Selecionado
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // 1. Carregar Dados do Treino
  useEffect(() => {
    const fetchTrainingData = async () => {
      try {
        const docRef = doc(db, 'trainings', trainingId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          toast.error('Treino não encontrado');
          navigate('/trainings');
          return;
        }

        const trainingData = docSnap.data();
        const exercisesSnap = await getDocs(collection(db, 'exercises'));
        const allExercises = exercisesSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));

        const hydratedExercises = (trainingData.exercises || [])
          .map(id => allExercises.find(ex => ex.id === id))
          .filter(Boolean);

        setTraining({ ...trainingData, firestoreId: docSnap.id, exerciseList: hydratedExercises });

      } catch (error) {
        console.error("Erro:", error);
        toast.error('Erro ao carregar detalhes');
      } finally {
        setLoading(false);
      }
    };

    fetchTrainingData();
  }, [trainingId, navigate]);

  // 2. Carregar Histórico do Exercício Selecionado (Analytics)
  useEffect(() => {
    const fetchExerciseStats = async () => {
        if (!selectedExercise || !user) return;
        setStatsLoading(true);

        try {
            // Busca todos os checkins do usuário
            // (Em app real, ideal seria filtrar melhor no backend, mas pro MVP filtramos aqui)
            const q = query(
                collection(db, 'checkIns'),
                where('userId', '==', user.uid),
                orderBy('date', 'asc') // Crescente para o gráfico
            );
            const snap = await getDocs(q);
            
            // Processa os dados para achar esse exercício
            const historyPoints = [];
            
            snap.docs.forEach(doc => {
                const data = doc.data();
                if (data.detailedLogs) {
                    // Procura o exercício nos logs detalhados
                    // O log é um Objeto { 0: [...], 1: [...] }, precisamos varrer ou saber o index.
                    // Como o index muda de treino pra treino, o ideal é procurar pelo ID do exercício se tivéssemos salvo.
                    // Como salvamos detailedLogs como Map indexado, vamos ter que confiar na consistência ou buscar pelo nome se possível.
                    // CORREÇÃO: Vamos buscar nos logs onde exerciseId bate, mas o detailedLogs atual salva por Index.
                    // WORKAROUND INTELIGENTE: Vamos assumir que se o treino tem o mesmo nome, a ordem é a mesma.
                    // Ou melhor: Vamos varrer os values do detailedLogs.
                    
                    Object.values(data.detailedLogs).forEach(sets => {
                        // Verifica se algum set tem carga > 0
                        // Infelizmente o detailedLogs atual não tem o ID do exercício dentro do objeto do set, só o peso/reps.
                        // Mas no 'TrainingExecution' salvamos exercisesData no Caminho A!
                        // Vamos tentar usar o exercisesData se disponível (feature antiga) ou inferir.
                    });
                }
                
                // PLANO B (Mais robusto para o Caminho A+C que fizemos):
                // Vamos usar o exercisesData (array) que implementamos no Caminho A se ele existir.
                // Se não, tentamos inferir.
                if (data.exercisesData) {
                    const exLog = data.exercisesData.find(e => e.exerciseId === selectedExercise.id || e.name === selectedExercise.name);
                    if (exLog && Number(exLog.weight) > 0) {
                        historyPoints.push({
                            date: new Date(data.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}),
                            value: Number(exLog.weight),
                            fullDate: data.date
                        });
                    }
                }
            });

            setExerciseHistory(historyPoints);

        } catch (err) {
            console.error("Erro stats:", err);
        } finally {
            setStatsLoading(false);
        }
    };

    if (selectedExercise) {
        fetchExerciseStats();
    }
  }, [selectedExercise, user]);

  const handleStartTraining = () => {
    if (training && training.firestoreId) {
      navigate(`/execution/${training.firestoreId}`);
    } else {
      toast.error("Erro: ID do treino inválido");
    }
  };

  // Cálculo de Máximas
  const maxWeight = exerciseHistory.length > 0 ? Math.max(...exerciseHistory.map(h => h.value)) : 0;
  const lastRecord = exerciseHistory.length > 0 ? exerciseHistory[exerciseHistory.length - 1] : null;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (!training) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-300 pb-32">
        
        <button onClick={() => navigate('/trainings')} className="mb-4 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white flex items-center transition-colors">
          ← Voltar para lista
        </button>

        {/* Card Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-6 border border-gray-100 dark:border-gray-700">
          <div className="bg-blue-600 dark:bg-blue-800 p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
                <h1 className="text-3xl font-bold">{training.name}</h1>
                <div className="flex gap-3 mt-2 text-blue-100 text-sm font-medium">
                <span className="bg-white/20 px-2 py-1 rounded capitalize">{training.difficulty}</span>
                <span className="bg-white/20 px-2 py-1 rounded">{training.exerciseList?.length} Exercícios</span>
                </div>
            </div>
            {/* Pattern de fundo */}
            <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
                <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22 14.86 20.57 16.29 22 18.43 19.86 19.86 21.29 21.29 19.86l-1.43-1.43L21.29 17l-1.43-1.43L18.43 17l-3.57-3.57L20.57 14.86z"/></svg>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{training.description}</p>
          </div>
        </div>

        {/* Lista de Exercícios */}
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 pl-1">Roteiro do Treino</h2>
        <div className="space-y-4">
          {training.exerciseList?.map((exercise, index) => (
            <div 
              key={`${exercise.id}-${index}`} 
              onClick={() => setSelectedExercise(exercise)}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 group flex gap-4 items-center"
            >
                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
                   <GifPlayer src={exercise.machineImage} alt={exercise.name} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 text-white font-bold text-xs bg-black/50 px-2 py-1 rounded">Ver Stats</span>
                   </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {index + 1}. {exercise.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">{exercise.muscleGroup}</p>
                  <div className="flex gap-3 mt-2 text-xs font-mono text-gray-600 dark:text-gray-300">
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{exercise.sets} Séries</span>
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{exercise.reps} Reps</span>
                  </div>
                </div>
                <div className="text-gray-300 dark:text-gray-600">➔</div>
            </div>
          ))}
        </div>

      {/* Botão Flutuante */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-100 via-gray-100 to-transparent dark:from-gray-900 dark:via-gray-900 z-10 flex justify-center pb-safe-area">
        <button
          onClick={handleStartTraining}
          className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-4 px-12 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2 mb-16 md:mb-0"
        >
          <span>▶️</span> INICIAR TREINO
        </button>
      </div>

      {/* Modal Detalhes + ANALYTICS */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 animate-fade-in p-0 md:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
            
            {/* Header Imagem */}
            <div className="relative h-64 bg-gray-200 dark:bg-gray-700">
               <img src={selectedExercise.machineImage} alt={selectedExercise.name} className="w-full h-full object-cover" />
               <button 
                onClick={() => setSelectedExercise(null)} 
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center transition backdrop-blur-md"
               >✕</button>
               <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                   <h2 className="text-2xl font-bold text-white">{selectedExercise.name}</h2>
                   <p className="text-gray-300 text-sm">{selectedExercise.muscleGroup}</p>
               </div>
            </div>

            <div className="p-6 space-y-6">
                
                {/* 1. SEÇÃO ANALYTICS (GRÁFICO) */}
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Sua Evolução de Carga</h3>
                        {maxWeight > 0 && (
                            <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                                PR: {maxWeight}kg 🏆
                            </span>
                        )}
                    </div>
                    
                    {statsLoading ? (
                        <div className="h-32 flex items-center justify-center text-gray-400 text-xs">Carregando dados...</div>
                    ) : exerciseHistory.length > 1 ? (
                        <SimpleLineChart data={exerciseHistory} />
                    ) : (
                        <div className="h-32 flex flex-col items-center justify-center text-gray-400 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                            <span className="text-2xl mb-2">📉</span>
                            <p className="text-xs">Sem dados suficientes para gráfico.</p>
                            <p className="text-[10px] mt-1">Complete mais treinos registrando carga!</p>
                        </div>
                    )}

                    {lastRecord && (
                        <p className="text-xs text-right text-gray-400 mt-2">
                            Último registro: <strong>{lastRecord.value}kg</strong> em {lastRecord.date}
                        </p>
                    )}
                </div>

                {/* 2. Instruções */}
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-white mb-2">Como Executar</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        {selectedExercise.execution || selectedExercise.description || "Sem descrição disponível."}
                    </p>
                </div>

                <button onClick={() => setSelectedExercise(null)} className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-4 rounded-xl font-bold transition">
                    Fechar
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}