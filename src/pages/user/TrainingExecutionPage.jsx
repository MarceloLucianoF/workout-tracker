import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// CORREÇÃO: Usar doc e getDoc
import { collection, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuthContext } from '../../hooks/AuthContext';
import toast from 'react-hot-toast';
import GifPlayer from '../../components/common/GifPlayer';
import VideoModal from '../../components/common/VideoModal';

export default function TrainingExecutionPage() {
  const { trainingId } = useParams(); // Agora é o ID do Firestore
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Busca o Treino DIRETO pelo ID do documento
        const docRef = doc(db, 'trainings', trainingId);
        const trainingSnap = await getDoc(docRef);

        if (!trainingSnap.exists()) {
          toast.error('Treino não encontrado!');
          navigate('/trainings');
          return;
        }

        const trainingData = trainingSnap.data();
        
        // 2. Busca exercícios
        const exercisesSnap = await getDocs(collection(db, 'exercises'));
        const allExercises = exercisesSnap.docs.map(doc => ({ 
          firestoreId: doc.id, 
          ...doc.data() 
        }));

        // 3. Hidratação
        const hydratedExercises = (trainingData.exercises || [])
          .map(exerciseId => allExercises.find(ex => ex.id === exerciseId))
          .filter(Boolean);

        setTraining({ 
          firestoreId: trainingSnap.id, // ID Único
          id: trainingData.id, // ID Numérico (mantemos caso precise)
          ...trainingData, 
          exercises: hydratedExercises 
        });

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error('Erro ao carregar treino.');
      } finally {
        setLoading(false);
      }
    };

    if (trainingId) fetchData();
  }, [trainingId, navigate]);

  // Cronômetro
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    if (!loading && training && training.exercises.length > 0) {
      setIsTimerRunning(true);
    }
  }, [loading, training]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleNextExercise = () => {
    if (activeExerciseIndex < (training.exercises?.length || 0) - 1) {
      setActiveExerciseIndex((prev) => prev + 1);
    }
  };

  const handlePrevExercise = () => {
    if (activeExerciseIndex > 0) {
      setActiveExerciseIndex((prev) => prev - 1);
    }
  };

  const toggleExerciseCompletion = (exerciseIndex) => {
    setCompletedExercises((prev) => {
      if (prev.includes(exerciseIndex)) {
        return prev.filter((i) => i !== exerciseIndex);
      } else {
        return [...prev, exerciseIndex];
      }
    });
  };

  const handleFinishTraining = async () => {
    setIsTimerRunning(false);
    const loadingToast = toast.loading('Salvando treino...');

    try {
      const completedIds = completedExercises.map(index => training.exercises[index].id);

      const checkInData = {
        userId: user.uid,
        userEmail: user.email,
        trainingId: training.id || 0, // Salva o ID numérico se tiver
        trainingFirestoreId: training.firestoreId, // Salva o ID real também
        trainingName: training.name,
        date: new Date().toISOString(),
        duration: timer,
        totalExercises: training.exercises.length,
        completedExercises: completedIds,
        timestamp: new Date()
      };

      await addDoc(collection(db, 'checkIns'), checkInData);
      
      toast.success('Treino concluído! 💪', { id: loadingToast });
      navigate('/history');
    } catch (error) {
      console.error("Erro ao salvar check-in:", error);
      toast.error('Erro ao salvar treino.', { id: loadingToast });
      setIsTimerRunning(true);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900"><p className="text-gray-500">Carregando...</p></div>;
  if (!training) return null;

  const currentExercise = training.exercises[activeExerciseIndex];
  const progress = Math.round((completedExercises.length / training.exercises.length) * 100);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 pb-20 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        
        {/* Cabeçalho Fixo */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg mb-6 sticky top-4 z-20 transition-colors">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-lg font-bold text-gray-800 dark:text-white truncate pr-2">{training.name}</h1>
            <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg">
              {formatTime(timer)}
            </div>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div className="bg-green-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-xs text-right text-gray-500 dark:text-gray-400 mt-1">
            {completedExercises.length}/{training.exercises.length} concluídos
          </p>
        </div>

        {/* Card do Exercício Atual */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-colors border border-gray-100 dark:border-gray-700">
          
          {/* Área da Imagem/GIF */}
          <div className="relative h-64 bg-gray-200 dark:bg-gray-700">
            <GifPlayer 
              src={currentExercise.machineImage} 
              alt={currentExercise.name} 
              className="w-full h-full object-cover"
            />
            
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-bold pointer-events-none">
              {activeExerciseIndex + 1} / {training.exercises.length}
            </div>

            {/* Botão de Vídeo Flutuante na Imagem */}
            {currentExercise.videoUrl && (
              <button 
                onClick={() => setShowVideo(true)}
                className="absolute bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
              >
                🎥 Ver Vídeo
              </button>
            )}
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{currentExercise.name}</h2>
              <button
                onClick={() => toggleExerciseCompletion(activeExerciseIndex)}
                className={`p-3 rounded-full transition-all transform hover:scale-110 shadow-md ${
                  completedExercises.includes(activeExerciseIndex)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-green-100 dark:hover:bg-green-900'
                }`}
              >
                {completedExercises.includes(activeExerciseIndex) ? '✓' : '○'}
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <span className="block text-2xl font-bold text-blue-600 dark:text-blue-400">{currentExercise.sets}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Séries</span>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <span className="block text-2xl font-bold text-blue-600 dark:text-blue-400">{currentExercise.reps}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Reps</span>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <span className="block text-2xl font-bold text-blue-600 dark:text-blue-400">{currentExercise.rest}s</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Descanso</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">ℹ️ Instruções</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{currentExercise.description}</p>
              </div>
              
              {currentExercise.execution && (
                 <div>
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">⚡ Como Executar</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{currentExercise.execution}</p>
                 </div>
              )}
            </div>
          </div>

          {/* Navegação */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 flex justify-between items-center border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={handlePrevExercise}
              disabled={activeExerciseIndex === 0}
              className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 font-medium disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              ⬅️ Anterior
            </button>

            {activeExerciseIndex === training.exercises.length - 1 ? (
              <button
                onClick={handleFinishTraining}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-green-600/30 transition transform hover:-translate-y-1"
              >
                Finalizar Treino 🏁
              </button>
            ) : (
              <button
                onClick={handleNextExercise}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-1"
              >
                Próximo ➡️
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE VÍDEO DO YOUTUBE */}
      {showVideo && (
        <VideoModal 
          videoUrl={currentExercise.videoUrl} 
          onClose={() => setShowVideo(false)} 
        />
      )}
    </div>
  );
}