import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuthContext } from '../../hooks/AuthContext';
import toast from 'react-hot-toast';
import VideoModal from '../../components/common/VideoModal';
import confetti from 'canvas-confetti';

// --- SUB-COMPONENTES VISUAIS ---

// 1. Timer de Descanso (Overlay Tela Cheia)
const RestTimerOverlay = ({ seconds, totalTime, onSkip, onAdd }) => {
  const percentage = totalTime > 0 ? ((totalTime - seconds) / totalTime) * 100 : 0;
  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-md animate-fade-in text-white p-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black mb-2 tracking-tight text-blue-400">DESCANSO</h2>
        <p className="text-gray-400 font-medium">Recupere a energia...</p>
      </div>
      <div className="relative w-64 h-64 flex items-center justify-center mb-12">
        <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90 drop-shadow-2xl">
          <circle cx="128" cy="128" r="115" stroke="#1e293b" strokeWidth="12" fill="transparent" />
          <circle 
            cx="128" cy="128" r="115" stroke="#3b82f6" strokeWidth="12" fill="transparent" 
            strokeDasharray={2 * Math.PI * 115}
            strokeDashoffset={2 * Math.PI * 115 * (percentage / 100)}
            strokeLinecap="round" className="transition-all duration-1000 ease-linear" 
          />
        </svg>
        <div className="flex flex-col items-center">
             <span className="text-7xl font-black tracking-tighter">{seconds}</span>
             <span className="text-sm text-blue-400 font-bold uppercase tracking-widest mt-2">Segundos</span>
        </div>
      </div>
      <div className="w-full max-w-xs grid grid-cols-2 gap-4">
        <button onClick={onSkip} className="bg-gray-800 hover:bg-gray-700 py-4 rounded-2xl font-bold text-white transition-colors border border-gray-700">Pular ⏭️</button>
        <button onClick={onAdd} className="bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold text-white shadow-lg shadow-blue-600/30 transition-colors">+30s ⏱️</button>
      </div>
    </div>
  );
};

// 2. Modal de Confirmação (Finish Incompleto)
const ConfirmFinishModal = ({ incompleteCount, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                    ⚠️
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Treino Incompleto</h3>
                <p className="text-gray-500 dark:text-gray-300">
                    Você ainda tem <strong className="text-yellow-600 dark:text-yellow-400">{incompleteCount} séries</strong> pendentes. Deseja finalizar mesmo assim?
                </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <button onClick={onCancel} className="py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200">
                    Cancelar
                </button>
                <button onClick={onConfirm} className="py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20">
                    Finalizar
                </button>
            </div>
        </div>
    </div>
);

// 3. Overlay de Pausa Global
const PausedOverlay = ({ onResume }) => (
    <div className="absolute inset-0 z-[50] bg-white/80 dark:bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center">
        <div className="text-6xl mb-4 animate-bounce">⏸️</div>
        <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-6">TREINO PAUSADO</h2>
        <button 
            onClick={onResume}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/30 transition-transform active:scale-95"
        >
            RETOMAR ▶️
        </button>
    </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function TrainingExecutionPage() {
  const { trainingId } = useParams();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [training, setTraining] = useState(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [setsLog, setSetsLog] = useState({}); 
  const [historyMap, setHistoryMap] = useState({}); 
  
  const [globalTimer, setGlobalTimer] = useState(0);
  const [isGlobalPaused, setIsGlobalPaused] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [totalRestTime, setTotalRestTime] = useState(0);
  
  const [showVideo, setShowVideo] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const restAudioRef = useRef(new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'));

  // 1. CARREGAMENTO INICIAL
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

        if (location.state?.customExerciseList) {
            exercisesToUse = location.state.customExerciseList;
        } else {
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

        // Busca Histórico
        const historyQ = query(
            collection(db, 'checkIns'),
            where('userId', '==', user.uid),
            orderBy('date', 'desc'),
            limit(20) 
        );
        const historySnap = await getDocs(historyQ);
        
        const loadMap = {};
        historySnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.exercises && Array.isArray(data.exercises)) {
                data.exercises.forEach(ex => {
                    if (!loadMap[ex.name]) {
                        const sets = ex.sets || [];
                        const maxWeight = Math.max(...sets.map(s => Number(s.weight) || 0));
                        if (maxWeight > 0) loadMap[ex.name] = maxWeight;
                    }
                });
            }
        });
        setHistoryMap(loadMap);

        const initialLog = {};
        exercisesToUse.forEach((ex, index) => {
          const sets = [];
          const suggestedWeight = loadMap[ex.name] || ''; 
          
          for (let i = 0; i < (ex.sets || 3); i++) {
            sets.push({ 
                weight: suggestedWeight, 
                reps: ex.reps || '', 
                completed: false 
            });
          }
          initialLog[index] = sets;
        });
        setSetsLog(initialLog);

      } catch (error) {
        console.error("Erro init:", error);
        toast.error('Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    };
    
    if (trainingId && user) fetchData();
  }, [trainingId, user, navigate, location.state]);

  // 2. TIMERS
  useEffect(() => {
    let interval;
    if (!loading && training && !isGlobalPaused) {
        interval = setInterval(() => setGlobalTimer(t => t + 1), 1000);
    }
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

  // 3. HANDLERS
  const handleInputChange = (exerciseIdx, setIdx, field, value) => {
    setSetsLog(prev => {
      const newLog = { ...prev };
      const exerciseSets = newLog[exerciseIdx].map(s => ({...s})); 
      exerciseSets[setIdx][field] = value;
      newLog[exerciseIdx] = exerciseSets;
      return newLog;
    });
  };

  const toggleSetCompletion = (exerciseIdx, setIdx) => {
    setSetsLog(prev => {
      const newLog = { ...prev };
      const exerciseSets = newLog[exerciseIdx].map(s => ({...s}));
      const targetSet = exerciseSets[setIdx];
      
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
      
      newLog[exerciseIdx] = exerciseSets;
      return newLog;
    });
  };

  const attemptFinish = () => {
      let incompleteCount = 0;
      Object.values(setsLog).forEach(sets => {
          sets.forEach(s => {
              if (!s.completed) incompleteCount++;
          });
      });

      if (incompleteCount > 0) {
          setShowConfirmModal(true);
      } else {
          saveTraining();
      }
  };

  const saveTraining = async () => {
    setShowConfirmModal(false);
    setIsGlobalPaused(true);
    const loadingToast = toast.loading('Salvando treino...');

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
      toast.success('Treino Salvo! 💪', { id: loadingToast });
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

  if (loading || !training) return <div className="min-h-screen flex items-center justify-center bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div></div>;

  const currentExercise = training.exercises[activeExerciseIndex];
  const currentSets = setsLog[activeExerciseIndex] || [];
  const progress = ((activeExerciseIndex + 1) / training.exercises.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-safe transition-colors duration-300 flex flex-col relative overflow-hidden">
      
      {/* Header Fixo */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-[40] pt-safe">
         <div className="h-1.5 bg-gray-200 dark:bg-gray-700 w-full">
            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }}></div>
         </div>
         <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <button onClick={() => navigate('/home')} className="text-gray-400 hover:text-red-500 font-bold text-sm">✕ SAIR</button>
            <button 
                onClick={() => setIsGlobalPaused(!isGlobalPaused)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono font-black text-lg transition-all border ${
                    isGlobalPaused 
                    ? 'bg-yellow-100 text-yellow-700 border-yellow-300 animate-pulse' 
                    : 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 border-transparent'
                }`}
            >
                {formatTime(globalTimer)} {isGlobalPaused ? '⏸' : ''}
            </button>
            <button onClick={() => setShowVideo(true)} className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg">
                🎥 Dica
            </button>
         </div>
      </div>

      {/* Conteúdo com Scroll */}
      <div className="flex-1 overflow-y-auto pb-40 relative">
         {isGlobalPaused && <PausedOverlay onResume={() => setIsGlobalPaused(false)} />}

         <div className="relative aspect-square w-full max-h-[35vh] bg-black group">
            <img 
                src={currentExercise.machineImage} 
                alt="Exercise" 
                className="w-full h-full object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pt-12">
                <h2 className="text-2xl md:text-3xl font-black text-white leading-none mb-1">{currentExercise.name}</h2>
                <div className="flex items-center gap-3">
                    <span className="text-gray-300 text-xs uppercase font-bold tracking-wider">{currentExercise.muscleGroup}</span>
                    {historyMap[currentExercise.name] && (
                        <span className="text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded backdrop-blur-md">
                            Carga Ant: {historyMap[currentExercise.name]}kg
                        </span>
                    )}
                </div>
            </div>
         </div>

         <div className="p-4 space-y-4">
            <div className="space-y-3">
                {currentSets.map((set, idx) => (
                    <div 
                        key={idx} 
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-300 ${
                            set.completed 
                            ? 'bg-green-50 dark:bg-green-900/10 border-green-500 dark:border-green-600 shadow-none' 
                            : 'bg-white dark:bg-gray-800 border-transparent shadow-sm border-gray-100 dark:border-gray-700'
                        }`}
                    >
                        <div className="flex flex-col items-center justify-center w-8">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Set</span>
                            <span className="text-xl font-black text-gray-700 dark:text-gray-300 leading-none">{idx + 1}</span>
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-0.5">Carga (kg)</label>
                            <input 
                                type="number" 
                                inputMode="decimal"
                                value={set.weight} 
                                onChange={(e) => handleInputChange(activeExerciseIndex, idx, 'weight', e.target.value)}
                                placeholder={historyMap[currentExercise.name] || '0'}
                                className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-xl px-2 py-3 text-center font-bold text-xl text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-300 dark:placeholder-gray-600"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-0.5">Reps</label>
                            <input 
                                type="number" 
                                inputMode="numeric"
                                value={set.reps} 
                                onChange={(e) => handleInputChange(activeExerciseIndex, idx, 'reps', e.target.value)}
                                placeholder="0"
                                className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-xl px-2 py-3 text-center font-bold text-xl text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <button 
                            onClick={() => toggleSetCompletion(activeExerciseIndex, idx)}
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-all active:scale-90 ${
                                set.completed 
                                ? 'bg-green-500 text-white shadow-green-500/30 rotate-0' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 rotate-0 hover:bg-gray-300'
                            }`}
                        >
                            {set.completed ? '✓' : ''}
                        </button>
                    </div>
                ))}
            </div>
            
            {currentExercise.execution && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-800/50 flex gap-3">
                    <span className="text-xl">💡</span>
                    <p className="leading-relaxed">{currentExercise.execution}</p>
                </div>
            )}
         </div>
      </div>

      {/* FOOTER FIXO (Z-Index Elevado + Padding Extra) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-4 z-[60] pb-8 md:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
         <div className="flex gap-3 max-w-md mx-auto">
             <button 
                onClick={() => setActiveExerciseIndex(p => Math.max(0, p - 1))}
                disabled={activeExerciseIndex === 0}
                className="px-6 py-4 rounded-xl font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-30 transition-colors"
             >
                ←
             </button>

             {activeExerciseIndex < training.exercises.length - 1 ? (
                 <button 
                    onClick={() => setActiveExerciseIndex(p => p + 1)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                 >
                    Próximo Exercício →
                 </button>
             ) : (
                 <button 
                    onClick={attemptFinish}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                 >
                    FINALIZAR TREINO 🏆
                 </button>
             )}
         </div>
      </div>

      {isResting && <RestTimerOverlay seconds={restSeconds} totalTime={totalRestTime} onSkip={() => setIsResting(false)} onAdd={() => setRestSeconds(s => s + 30)} />}
      {showVideo && <VideoModal videoUrl={currentExercise.videoUrl} onClose={() => setShowVideo(false)} />}
      {showConfirmModal && (
          <ConfirmFinishModal 
            incompleteCount={Object.values(setsLog).flat().filter(s => !s.completed).length} 
            onConfirm={saveTraining} 
            onCancel={() => setShowConfirmModal(false)} 
          />
      )}
    </div>
  );
}