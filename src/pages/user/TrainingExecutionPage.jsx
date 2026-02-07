import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuthContext } from '../../hooks/AuthContext';
import toast from 'react-hot-toast';
import GifPlayer from '../../components/common/GifPlayer';
import VideoModal from '../../components/common/VideoModal';

// Componente visual do Timer de Descanso (Overlay)
const RestTimerOverlay = ({ seconds, totalTime, onSkip, onAdd }) => {
  const percentage = totalTime > 0 ? ((totalTime - seconds) / totalTime) * 100 : 0;
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in text-white p-4">
      <div className="text-center mb-8 animate-pulse">
        <h2 className="text-4xl font-bold mb-2 text-blue-400">DESCANSE 😤</h2>
        <p className="text-gray-400 text-lg">Respire fundo...</p>
      </div>

      <div className="relative w-64 h-64 flex items-center justify-center mb-10">
        <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
          <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-800" />
          <circle 
            cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="12" fill="transparent" 
            className="text-blue-500 transition-all duration-1000 ease-linear"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (percentage / 100)}
            strokeLinecap="round"
          />
        </svg>
        <div className="flex flex-col items-center">
             <span className="text-7xl font-mono font-bold">{seconds}</span>
             <span className="text-sm text-gray-400 uppercase tracking-widest mt-1">segundos</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button onClick={onSkip} className="w-full bg-gray-800 hover:bg-gray-700 py-4 rounded-xl font-bold text-lg border border-gray-700">Pular Descanso ⏭️</button>
        <button onClick={onAdd} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold text-lg shadow-lg">+30s Extra ⏱️</button>
      </div>
    </div>
  );
};

export default function TrainingExecutionPage() {
  const { trainingId } = useParams();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [globalTimer, setGlobalTimer] = useState(0);
  const [isGlobalPaused, setIsGlobalPaused] = useState(false);
  
  // States de Log
  const [setsLog, setSetsLog] = useState({});
  const [historyLoads, setHistoryLoads] = useState({});
  
  // States de Descanso
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
        const exercisesSnap = await getDocs(collection(db, 'exercises'));
        const allExercises = exercisesSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
        const hydratedExercises = (trainingData.exercises || [])
          .map(exId => allExercises.find(e => e.id === exId))
          .filter(Boolean);

        const fullTraining = { firestoreId: trainingSnap.id, ...trainingData, exercises: hydratedExercises };
        setTraining(fullTraining);

        const initialLog = {};
        hydratedExercises.forEach((ex, index) => {
          const sets = [];
          for (let i = 0; i < (ex.sets || 3); i++) {
            sets.push({ weight: '', reps: ex.reps || '', completed: false });
          }
          initialLog[index] = sets;
        });
        setSetsLog(initialLog);

        if (user && fullTraining.id) {
          const historyQ = query(
            collection(db, 'checkIns'),
            where('userId', '==', user.uid),
            where('trainingId', '==', fullTraining.id),
            orderBy('date', 'desc'),
            limit(1)
          );
          const historySnap = await getDocs(historyQ);
          if (!historySnap.empty) {
            const lastData = historySnap.docs[0].data();
            if (lastData.detailedLogs) setHistoryLoads(lastData.detailedLogs);
          }
        }
      } catch (error) {
        console.error("Erro:", error);
        toast.error('Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    };
    if (trainingId && user) fetchData();
  }, [trainingId, user, navigate]);

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
             restAudioRef.current.play().catch(e => console.log("Audio play failed"));
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
      const targetSet = { ...exerciseSets[setIdx] };
      targetSet[field] = value;
      exerciseSets[setIdx] = targetSet;
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

  // --- NOVA FUNÇÃO DE PULAR EXERCÍCIO ---
  const handleSkipExercise = () => {
    if (activeExerciseIndex < (training.exercises?.length || 0) - 1) {
        setActiveExerciseIndex(p => p + 1);
        toast('Exercício pulado', { icon: '⏭️' });
    }
  };

  const handleFinishTraining = async () => {
    setIsGlobalPaused(true);
    const loadingToast = toast.loading('Finalizando treino...');

    try {
      let totalSetsDone = 0;
      let totalVolume = 0;
      
      Object.values(setsLog).forEach(sets => {
        sets.forEach(s => {
          if (s.completed) {
            totalSetsDone++;
            // Garante que é número, se estiver vazio vira 0
            totalVolume += (Number(s.weight) || 0) * (Number(s.reps) || 0);
          }
        });
      });

      const checkInData = {
        userId: user.uid,
        userEmail: user.email,
        trainingId: training.id || 0,
        trainingName: training.name,
        date: new Date().toISOString(),
        duration: globalTimer,
        detailedLogs: setsLog,
        totalSetsDone,
        totalVolume,
        totalExercises: training.exercises.length, // Importante para o histórico
        timestamp: new Date()
      };

      await addDoc(collection(db, 'checkIns'), checkInData);
      toast.success('Treino Monstro! 💪', { id: loadingToast });
      navigate('/history');

    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error('Erro ao salvar.', { id: loadingToast });
      setIsGlobalPaused(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (!training) return null;

  const currentExercise = training.exercises[activeExerciseIndex];
  const currentSets = setsLog[activeExerciseIndex] || [];
  const isExerciseComplete = currentSets.every(s => s.completed);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 pb-24 transition-colors duration-300">
      
      {/* Header Global */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg mb-4 sticky top-4 z-20 border border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <div className="flex flex-col">
            <h1 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tempo Total</h1>
            <div className={`text-3xl font-mono font-bold ${isGlobalPaused ? 'text-yellow-500' : 'text-blue-600 dark:text-blue-400'}`}>
                {formatTime(globalTimer)}
            </div>
        </div>
        <button 
            onClick={() => setIsGlobalPaused(!isGlobalPaused)}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${isGlobalPaused ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
        >
            {isGlobalPaused ? '▶️ RETOMAR' : '⏸️ PAUSAR'}
        </button>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Card Visual */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden relative">
             <div className="h-56 relative bg-gray-200 dark:bg-gray-700">
                <GifPlayer src={currentExercise.machineImage} alt={currentExercise.name} className="w-full h-full object-cover" />
                {currentExercise.videoUrl && (
                  <button onClick={() => setShowVideo(true)} className="absolute bottom-3 right-3 bg-red-600/90 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1 backdrop-blur-sm">🎥 Vídeo</button>
                )}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold">
                    Exercício {activeExerciseIndex + 1} / {training.exercises.length}
                </div>
             </div>
             <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white leading-tight">{currentExercise.name}</h2>
                <div className="flex flex-wrap gap-3 mt-3">
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-800">🔄 {currentExercise.sets} Séries</span>
                    <span className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-lg text-xs font-bold border border-purple-100 dark:border-purple-800">⚡ {currentExercise.reps} Reps</span>
                </div>
             </div>
        </div>

        {/* Tabela de Séries */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden p-4 border border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-12 gap-2 mb-3 px-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">
                <div className="col-span-1">Set</div>
                <div className="col-span-4">Carga (Kg)</div>
                <div className="col-span-4">Reps</div>
                <div className="col-span-3">Status</div>
            </div>
            <div className="space-y-3">
                {currentSets.map((set, idx) => {
                    const prevLoad = historyLoads[activeExerciseIndex]?.[idx]?.weight || historyLoads[activeExerciseIndex]?.[0]?.weight || '-';
                    return (
                        <div key={idx} className={`grid grid-cols-12 gap-2 items-center p-3 rounded-xl transition-all border ${set.completed ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
                            <div className="col-span-1 flex justify-center"><span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${set.completed ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>{idx + 1}</span></div>
                            <div className="col-span-4 relative"><input type="number" inputMode="decimal" placeholder={prevLoad !== '-' ? prevLoad : '0'} value={set.weight} onChange={(e) => handleInputChange(activeExerciseIndex, idx, 'weight', e.target.value)} className={`w-full text-center py-2.5 rounded-lg font-bold outline-none ring-1 ring-inset transition-all ${set.completed ? 'bg-green-100/50 text-green-800 ring-green-300' : 'bg-white text-gray-800 ring-gray-200 dark:bg-gray-700 dark:text-white dark:ring-gray-600'}`} />
                                {idx === 0 && prevLoad !== '-' && !set.weight && (<span className="absolute -top-2 left-0 right-0 text-[8px] text-center text-gray-400 font-medium bg-white dark:bg-gray-800 w-max mx-auto px-1">Ant: {prevLoad}kg</span>)}
                            </div>
                            <div className="col-span-4"><input type="number" inputMode="numeric" placeholder={currentExercise.reps} value={set.reps} onChange={(e) => handleInputChange(activeExerciseIndex, idx, 'reps', e.target.value)} className={`w-full text-center py-2.5 rounded-lg font-bold outline-none ring-1 ring-inset transition-all ${set.completed ? 'bg-green-100/50 text-green-800 ring-green-300' : 'bg-white text-gray-800 ring-gray-200 dark:bg-gray-700 dark:text-white dark:ring-gray-600'}`} /></div>
                            <button onClick={() => toggleSetCompletion(activeExerciseIndex, idx)} className={`col-span-3 h-11 rounded-lg flex items-center justify-center transition-all active:scale-95 shadow-sm ${set.completed ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>{set.completed ? '✅' : 'OK'}</button>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* 4. Navegação COM BOTÃO PULAR */}
        <div className="flex gap-3 pt-4">
             <button
                onClick={() => setActiveExerciseIndex(p => Math.max(0, p - 1))}
                disabled={activeExerciseIndex === 0}
                className="flex-1 py-4 rounded-xl font-bold bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-sm disabled:opacity-50 border border-gray-100 dark:border-gray-700"
             >
                ⬅️ Anterior
             </button>

             {/* BOTÃO PULAR NOVO */}
             {activeExerciseIndex < training.exercises.length - 1 && (
                 <button
                    onClick={handleSkipExercise}
                    className="w-16 flex items-center justify-center rounded-xl font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-200 transition-colors"
                    title="Pular exercício"
                 >
                    ⏭️
                 </button>
             )}

             {activeExerciseIndex < training.exercises.length - 1 ? (
                 <button
                    onClick={() => setActiveExerciseIndex(p => p + 1)}
                    className={`flex-[2] py-4 rounded-xl font-bold text-white shadow-lg transition-all border border-transparent ${
                        isExerciseComplete 
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30 animate-pulse-slow' 
                        : 'bg-blue-400 hover:bg-blue-500' 
                    }`}
                 >
                    Próximo ➡️
                 </button>
             ) : (
                 <button
                    onClick={handleFinishTraining}
                    className="flex-[2] py-4 rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30 hover:scale-105 transition-transform"
                 >
                    Finalizar 🏁
                 </button>
             )}
        </div>
      </div>

      {isResting && <RestTimerOverlay seconds={restSeconds} totalTime={totalRestTime} onSkip={() => setIsResting(false)} onAdd={() => setRestSeconds(s => s + 30)} />}
      {showVideo && <VideoModal videoUrl={currentExercise.videoUrl} onClose={() => setShowVideo(false)} />}
    </div>
  );
}