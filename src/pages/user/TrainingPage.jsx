import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuthContext } from '../../hooks/AuthContext';
import toast from 'react-hot-toast';
import GifPlayer from '../../components/common/GifPlayer';

// --- COMPONENTE DE GRÁFICO SVG (Simples e Leve) ---
const SimpleLineChart = ({ data, color = "#3b82f6" }) => {
  if (!data || data.length < 2) return <div className="text-center text-gray-400 text-xs py-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg">Registre pelo menos 2 treinos para ver o gráfico.</div>;

  const maxVal = Math.max(...data.map(d => d.value));
  const minVal = Math.min(...data.map(d => d.value));
  const range = maxVal - minVal || 1;

  const width = 300;
  const height = 100;
  const padding = 10;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((d.value - minVal) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full overflow-hidden">
       <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <polyline fill="none" stroke={color} strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" />
          {data.map((d, i) => {
             const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
             const y = height - padding - ((d.value - minVal) / range) * (height - 2 * padding);
             return <circle key={i} cx={x} cy={y} r="3" fill="white" stroke={color} strokeWidth="2" />;
          })}
       </svg>
       <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-mono">
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
  
  // Analytics
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // 1. CARREGAR TREINO COM HIDRATAÇÃO ROBUSTA
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
        
        // Busca todos exercícios para cruzar
        const exercisesSnap = await getDocs(collection(db, 'exercises'));
        const allExercises = exercisesSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));

        // AQUI ESTA A CORREÇÃO:
        // Procura por ID do Firestore OU ID Original (Numérico)
        const hydratedExercises = (trainingData.exercises || [])
          .map(exId => {
             const idStr = String(exId);
             return allExercises.find(e => 
                String(e.firestoreId) === idStr || String(e.originalId) === idStr || String(e.id) === idStr
             );
          })
          .filter(Boolean); // Remove nulos

        setTraining({ 
            ...trainingData, 
            firestoreId: docSnap.id, 
            exerciseList: hydratedExercises 
        });

      } catch (error) {
        console.error("Erro:", error);
        toast.error('Erro ao carregar detalhes');
      } finally {
        setLoading(false);
      }
    };

    fetchTrainingData();
  }, [trainingId, navigate]);

  // 2. Carregar Histórico (Analytics)
  useEffect(() => {
    const fetchExerciseStats = async () => {
        if (!selectedExercise || !user) return;
        setStatsLoading(true);

        try {
            const q = query(
                collection(db, 'checkIns'),
                where('userId', '==', user.uid),
                orderBy('date', 'asc')
            );
            const snap = await getDocs(q);
            
            const historyPoints = [];
            
            snap.docs.forEach(doc => {
                const data = doc.data();
                // Procura no array de dados do treino (novo formato)
                if (data.detailedLogs) {
                    // Tenta achar logs que tenham peso registrado
                    Object.values(data.detailedLogs).forEach(sets => {
                        // Lógica simplificada: Se acharmos um log, assumimos que é desse ex se não tivermos ID. 
                        // Idealmente detailedLogs deveria ter o ID do exercicio.
                    });
                }
                
                // Formato Novo (TrainingExecutionPage)
                // Se você implementar exercisesData no futuro, use aqui.
                // Por enquanto, vamos deixar placeholder ou lógica simples
            });

            // Mock para visualização se não tiver dados reais ainda
            // Remova isso quando tiver dados reais consistentes
            if (historyPoints.length === 0) {
                // setExerciseHistory([]); 
            } else {
                setExerciseHistory(historyPoints);
            }

        } catch (err) {
            console.error(err);
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

  const maxWeight = exerciseHistory.length > 0 ? Math.max(...exerciseHistory.map(h => h.value)) : 0;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (!training) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 pb-32">
        
        {/* Imagem de Fundo / Header */}
        <div className="relative h-64 bg-blue-600">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900 z-10"></div>
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            
            <div className="absolute top-6 left-4 z-20">
                <button onClick={() => navigate('/trainings')} className="text-white/80 hover:text-white flex items-center gap-1 font-bold bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg transition-colors">
                  ← Voltar
                </button>
            </div>

            <div className="absolute bottom-4 left-6 z-20 pr-6">
                <h1 className="text-3xl md:text-4xl font-black text-gray-800 dark:text-white leading-tight drop-shadow-sm mb-2">
                    {training.name}
                </h1>
                <div className="flex gap-2">
                    <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                        {training.difficulty}
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                        {training.exerciseList?.length} Exercícios
                    </span>
                </div>
            </div>
        </div>

        <div className="px-6 -mt-2 relative z-20">
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-8">
                {training.description}
            </p>

            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                Roteiro do Treino <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 rounded-full">{training.exerciseList?.length}</span>
            </h2>

            <div className="space-y-3">
              {training.exerciseList?.map((exercise, index) => (
                <div 
                  key={exercise.firestoreId || index} 
                  onClick={() => setSelectedExercise(exercise)}
                  className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 flex gap-4 items-center cursor-pointer group transition-all"
                >
                    <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                       <GifPlayer src={exercise.machineImage} alt={exercise.name} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                        {exercise.name}
                      </h3>
                      <p className="text-xs text-gray-500 capitalize mb-1">{exercise.muscleGroup}</p>
                      <div className="flex gap-2 text-[10px] font-mono font-bold text-gray-400 uppercase">
                        <span>{exercise.sets} Sets</span>
                        <span>•</span>
                        <span>{exercise.reps} Reps</span>
                      </div>
                    </div>
                    
                    <div className="text-gray-300">➔</div>
                </div>
              ))}
            </div>
        </div>

      {/* Botão Flutuante */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent dark:from-gray-900 dark:via-gray-900 z-30 pb-safe">
        <button
          onClick={handleStartTraining}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex justify-center items-center gap-2"
        >
          <span>🚀</span> COMEÇAR AGORA
        </button>
      </div>

      {/* Modal Detalhes */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center z-50 animate-fade-in" onClick={() => setSelectedExercise(null)}>
          <div className="bg-white dark:bg-gray-800 w-full md:max-w-md md:rounded-2xl rounded-t-3xl overflow-hidden shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            
            <div className="relative h-56 bg-gray-900">
               <GifPlayer src={selectedExercise.machineImage} className="w-full h-full object-contain opacity-90" />
               <button onClick={() => setSelectedExercise(null)} className="absolute top-4 right-4 bg-black/50 text-white w-8 h-8 rounded-full font-bold">✕</button>
            </div>

            <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{selectedExercise.name}</h2>
                <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">{selectedExercise.muscleGroup}</span>

                <div className="mt-6 space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Instruções</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {selectedExercise.execution || selectedExercise.description || "Sem instruções cadastradas."}
                        </p>
                    </div>

                    {/* Gráfico Placeholder - Futuro: Ligar com dados reais */}
                    {exerciseHistory.length > 1 && (
                        <div className="mt-4">
                            <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Seu Histórico</h3>
                            <SimpleLineChart data={exerciseHistory} />
                        </div>
                    )}
                </div>

                <button onClick={() => setSelectedExercise(null)} className="w-full mt-6 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white font-bold py-3 rounded-xl">
                    Fechar
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}