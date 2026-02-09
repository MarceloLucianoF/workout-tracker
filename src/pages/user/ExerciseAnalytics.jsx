import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuthContext } from '../../hooks/AuthContext';
import toast from 'react-hot-toast';
import VideoModal from '../../components/common/VideoModal';
import confetti from 'canvas-confetti';

const RestTimerOverlay = ({ seconds, totalTime, onSkip, onAdd }) => {
  const percentage = totalTime > 0 ? ((totalTime - seconds) / totalTime) * 100 : 0;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-xl animate-fade-in text-white p-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black mb-2 tracking-tight">DESCANSO</h2>
        <p className="text-gray-400 font-medium">Recupere o fôlego...</p>
      </div>
      <div className="relative w-72 h-72 flex items-center justify-center mb-12">
        <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90 drop-shadow-2xl">
          <circle cx="144" cy="144" r="130" stroke="#334155" strokeWidth="16" fill="transparent" />
          <circle cx="144" cy="144" r="130" stroke="#3b82f6" strokeWidth="16" fill="transparent" 
            strokeDasharray={2 * Math.PI * 130}
            strokeDashoffset={2 * Math.PI * 130 * (percentage / 100)}
            strokeLinecap="round" className="transition-all duration-1000 ease-linear" />
        </svg>
        <div className="flex flex-col items-center">
             <span className="text-8xl font-black tracking-tighter">{seconds}</span>
             <span className="text-sm text-blue-400 font-bold uppercase tracking-widest mt-2">Segundos</span>
        </div>
      </div>
      <div className="w-full max-w-sm grid grid-cols-2 gap-4">
        <button onClick={onSkip} className="bg-gray-800 hover:bg-gray-700 py-4 rounded-2xl font-bold text-white transition-colors">Pular</button>
        <button onClick={onAdd} className="bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold text-white shadow-lg shadow-blue-600/30 transition-colors">+30s</button>
      </div>
    </div>
  );
};

export default function TrainingExecutionPage() {
  const { trainingId } = useParams();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation(); // Pegar estado da navegação

  const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [globalTimer, setGlobalTimer] = useState(0);
  const [isGlobalPaused, setIsGlobalPaused] = useState(false);
  
  const [setsLog, setSetsLog] = useState({});
  const [historyMap, setHistoryMap] = useState({}); // Mapa { "Nome Exercício": Peso }
  
  const [isResting, setIsResting] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [totalRestTime, setTotalRestTime] = useState(0);
  const restAudioRef = useRef(new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'trainings', trainingId);
        const trainingSnap = await getDoc(docRef);

        if (!trainingSnap.exists()) {
          toast.error('Treino não encontrado!');
          navigate('/trainings');
          return;
        }

        const trainingData = trainingSnap.data();
        let exercisesToUse = [];

        // 1. Verifica se veio lista personalizada do TrainingPage
        if (location.state?.customExerciseList) {
            exercisesToUse = location.state.customExerciseList;
        } else {
            // Se não (acesso direto ou refresh), hidrata do banco normal
            const exercisesSnap = await getDocs(collection(db, 'exercises'));
            const allExercises = exercisesSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
            
            exercisesToUse = (trainingData.exercises || [])
              .map(exId => {
                 const idStr = String(exId);
                 return allExercises.find(e => String(e.firestoreId) === idStr || String(e.id) === idStr);
              })
              .filter(Boolean);
        }

        if (exercisesToUse.length === 0) {
            toast.error("Treino vazio.");
            navigate('/trainings');
            return;
        }

        const fullTraining = { 
            firestoreId: trainingSnap.id, 
            ...trainingData, 
            exercises: exercisesToUse 
        };
        
        setTraining(fullTraining);

        // 2. Busca Histórico Inteligente (Último checkin desse treino)
        const historyQ = query(
            collection(db, 'checkIns'),
            where('userId', '==', user.uid),
            // where('trainingId', '==', trainingId), // Removido para buscar globalmente por nome do exercício
            orderBy('date', 'desc'),
            limit(5) // Pega os últimos 5 treinos gerais para varrer
        );
        const historySnap = await getDocs(historyQ);
        
        const loadMap = {};
        // Varre histórico para encontrar última carga de cada exercício pelo NOME
        // (Isso funciona mesmo se mudar a ordem ou o treino)
        historySnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.exercises) {
                data.exercises.forEach(ex => {
                    // Se ainda não achamos carga pra esse nome, salva a mais recente
                    if (!loadMap[ex.name]) {
                        // Pega a maior carga usada nas séries desse exercício
                        const maxWeight = Math.max(...(ex.sets?.map(s => Number(s.weight) || 0) || [0]));
                        if (maxWeight > 0) loadMap[ex.name] = maxWeight;
                    }
                });
            }
        });
        setHistoryMap(loadMap);

        // 3. Preenche Logs Iniciais (Auto-fill com histórico)
        const initialLog = {};
        exercisesToUse.forEach((ex, index) => {
          const sets = [];
          const suggestedWeight = loadMap[ex.name] || ''; // Auto-fill weight!
          
          for (let i = 0; i < (ex.sets || 3); i++) {
            sets.push({ 
                weight: suggestedWeight, // Já inicia preenchido!
                reps: ex.reps || '', 
                completed: false 
            });
          }
          initialLog[index] = sets;
        });
        setSetsLog(initialLog);

      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    };
    if (trainingId && user) fetchData();
  }, [trainingId, user, navigate, location.state]);

  useEffect(() => {
    let interval;
    if (!loading && training && !isGlobalPaused) interval = setInterval(() => setGlobalTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [loading, training, isGlobalPaused]);

  useEffect(() => {
    let interval;
    if (isResting && restSeconds > 0) {
      interval = setInterval(() => {
        setRestSeconds(prev => {
           if (prev <= 1) {
             restAudioRef.current.play().catch(() => {});
             setIsResting(false);
             return 0;
           }
           return prev - 1;
        });
      }, 1000);
    } else if (isResting && restSeconds === 0) setIsResting(false);
    return () => clearInterval(interval);
  }, [isResting, restSeconds]);

  const handleInputChange = (exerciseIdx, setIdx, field, value) => {
    setSetsLog(prev => {
      const newLog = { ...prev };
      const exerciseSets = [...(newLog[exerciseIdx] || [])];
      exerciseSets[setIdx] = { ...exerciseSets[setIdx], [field]: value };
      newLog[exerciseIdx] = exerciseSets;
      return newLog;
    });
  };

  const toggleSetCompletion = (exerciseIdx, setIdx) => {
    setSetsLog(prev => {
      const newLog = { ...prev };
      const exerciseSets = [...(newLog[exerciseIdx] || [])];
      const targetSet = { ...exerciseSets[setIdx] };
      
      const isCompletingNow = !targetSet.completed;
      targetSet.completed = isCompletingNow;

      if (isCompletingNow) {
        const totalSets = training.exercises[exerciseIdx].sets;
        if (setIdx < totalSets - 1) {
            const restTime = training.exercises[exerciseIdx].rest || 60;
            setRestSeconds(restTime);
            setTotalRestTime(restTime);
            setIsResting(true);
        }
      }
      
      exerciseSets[setIdx] = targetSet;
      newLog[exerciseIdx] = exerciseSets;
      return newLog;
    });
  };

  const handleFinishTraining = async () => {
    setIsGlobalPaused(true);
    const loadingToast = toast.loading('Salvando...');

    try {
      let totalSetsDone = 0;
      let totalVolume = 0;
      
      const finalExercisesLog = training.exercises.map((ex, exIdx) => {
          const sets = setsLog[exIdx] || [];
          const cleanSets = sets.map(s => {
              if(s.completed) {
                  totalSetsDone++;
                  totalVolume += (Number(s.weight) || 0) * (Number(s.reps) || 0);
              }
              return { weight: s.weight, reps: s.reps, completed: s.completed };
          });
          return { name: ex.name, sets: cleanSets };
      });

      const checkInData = {
        userId: user.uid,
        userEmail: user.email,
        trainingId: training.firestoreId,
        trainingName: training.name,
        date: new Date().toISOString(),
        duration: globalTimer,
        exercises: finalExercisesLog,
        totalSetsDone,
        totalVolume,
        timestamp: new Date()
      };

      await addDoc(collection(db, 'checkIns'), checkInData);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      toast.success('Treino Salvo!', { id: loadingToast });
      navigate('/history');

    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar.', { id: loadingToast });
      setIsGlobalPaused(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading || !training) return <div className="h-screen bg-gray-900"></div>;

  const currentExercise = training.exercises[activeExerciseIndex];
  const currentSets = setsLog[activeExerciseIndex] || [];
  const progress = ((activeExerciseIndex + 1) / training.exercises.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-safe transition-colors duration-300 flex flex-col">
      
      {/* 1. Header Fixo: Progresso e Timer */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30 pt-safe">
         <div className="h-1 bg-gray-200 dark:bg-gray-700 w-full">
            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }}></div>
         </div>
         <div className="flex justify-between items-center px-4 py-3">
            <button onClick={() => navigate('/home')} className="text-gray-400 hover:text-red-500 font-bold">✕ Sair</button>
            
            {/* BOTÃO PAUSE RESGATADO */}
            <button 
                onClick={() => setIsGlobalPaused(!isGlobalPaused)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-mono font-bold transition-all ${
                    isGlobalPaused 
                    ? 'bg-yellow-100 text-yellow-700 border-yellow-300 animate-pulse' 
                    : 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 border-transparent'
                }`}
            >
                {isGlobalPaused ? '⏸ PAUSADO' : `⏱ ${formatTime(globalTimer)}`}
            </button>

            <button onClick={() => setShowVideo(true)} className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                🎥 Vídeo
            </button>
         </div>
      </div>

      {/* 2. Área do Exercício (Scrollável) */}
      <div className="flex-1 overflow-y-auto pb-32">
         
         {/* GIF "Imersivo" (Loop Infinito) */}
         <div className="relative aspect-square w-full max-h-[35vh] bg-black">
            <img 
                src={currentExercise.machineImage} 
                alt="Exercise" 
                className="w-full h-full object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-10">
                <h2 className="text-2xl font-bold text-white leading-tight">{currentExercise.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-300 text-xs uppercase font-bold tracking-wider">{currentExercise.muscleGroup}</span>
                    {historyMap[currentExercise.name] && (
                        <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded backdrop-blur-md">
                            Última Carga: {historyMap[currentExercise.name]}kg
                        </span>
                    )}
                </div>
            </div>
         </div>

         {/* Controles de Série */}
         <div className="p-4 space-y-4">
            <div className="space-y-3">
                {currentSets.map((set, idx) => (
                    <div 
                        key={idx} 
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                            set.completed 
                            ? 'bg-green-50 dark:bg-green-900/10 border-green-500 dark:border-green-600' 
                            : 'bg-white dark:bg-gray-800 border-transparent shadow-sm border-gray-100 dark:border-gray-700'
                        }`}
                    >
                        <div className="flex flex-col items-center justify-center w-8">
                            <span className="text-xs font-bold text-gray-400">SET</span>
                            <span className="text-lg font-black text-gray-700 dark:text-gray-300">{idx + 1}</span>
                        </div>

                        {/* Input Peso (PREENCHIDO AUTOMATICO SE TIVER HISTORICO) */}
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Kg</label>
                            <input 
                                type="number" 
                                value={set.weight} 
                                onChange={(e) => handleInputChange(activeExerciseIndex, idx, 'weight', e.target.value)}
                                placeholder={historyMap[currentExercise.name] || '0'}
                                className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-xl px-3 py-2 text-center font-bold text-lg text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>

                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Reps</label>
                            <input 
                                type="number" 
                                value={set.reps} 
                                onChange={(e) => handleInputChange(activeExerciseIndex, idx, 'reps', e.target.value)}
                                placeholder="0"
                                className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-xl px-3 py-2 text-center font-bold text-lg text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>

                        <button 
                            onClick={() => toggleSetCompletion(activeExerciseIndex, idx)}
                            className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-sm transition-transform active:scale-90 ${
                                set.completed 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                            }`}
                        >
                            {set.completed ? '✓' : ''}
                        </button>
                    </div>
                ))}
            </div>
         </div>
      </div>

      {/* 3. Rodapé de Navegação */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-4 pb-safe z-30">
         <div className="flex gap-3">
             <button 
                onClick={() => setActiveExerciseIndex(p => Math.max(0, p - 1))}
                disabled={activeExerciseIndex === 0}
                className="px-6 py-4 rounded-xl font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-50"
             >
                ←
             </button>

             {activeExerciseIndex < training.exercises.length - 1 ? (
                 <button 
                    onClick={() => setActiveExerciseIndex(p => p + 1)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                 >
                    Próximo Exercício →
                 </button>
             ) : (
                 <button 
                    onClick={handleFinishTraining}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 active:scale-95 transition-all"
                 >
                    FINALIZAR TREINO 🏆
                 </button>
             )}
         </div>
      </div>

      {isResting && <RestTimerOverlay seconds={restSeconds} totalTime={totalRestTime} onSkip={() => setIsResting(false)} onAdd={() => setRestSeconds(s => s + 30)} />}
      {showVideo && <VideoModal videoUrl={currentExercise.videoUrl} onClose={() => setShowVideo(false)} />}
    </div>
  );
}