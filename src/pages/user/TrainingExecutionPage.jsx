import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuthContext } from '../../hooks/AuthContext';
import toast from 'react-hot-toast';

export default function TrainingExecutionPage() {
  const { trainingId } = useParams();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🔍 Buscando treino com ID (campo):", trainingId);
        
        // 1. Busca o Treino pelo campo 'id' numérico (ex: 1)
        const trainingQuery = query(
          collection(db, 'trainings'), 
          where('id', '==', Number(trainingId))
        );
        const trainingSnap = await getDocs(trainingQuery);

        if (trainingSnap.empty) {
          console.error("❌ Treino não encontrado.");
          toast.error('Treino não encontrado!');
          navigate('/trainings');
          return;
        }

        // Pega o primeiro resultado encontrado
        const trainingDoc = trainingSnap.docs[0];
        const trainingData = trainingDoc.data();
        const trainingFirestoreId = trainingDoc.id; // Guarda o ID real do documento (JanLq...)
        
        // 2. Busca TODOS os exercícios para cruzar os dados
        const exercisesSnap = await getDocs(collection(db, 'exercises'));
        // Importante: Mantemos o 'id' interno (número) e salvamos o firestoreId separado
        const allExercises = exercisesSnap.docs.map(doc => ({ 
          firestoreId: doc.id, 
          ...doc.data() 
        }));

        // 3. Hidratação: Cruza os números [1, 3, 5] com os exercícios baixados
        const hydratedExercises = (trainingData.exercises || [])
          .map(exerciseId => allExercises.find(ex => ex.id === exerciseId))
          .filter(Boolean); // Remove vazios se não achar algum

        if (hydratedExercises.length === 0) {
          toast.error('Este treino não possui exercícios válidos.');
        }

        setTraining({ 
          firestoreId: trainingFirestoreId, // ID do banco (Hash)
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

    if (trainingId) {
      fetchData();
    }
  }, [trainingId, navigate]);

  // --- O RESTO DO CÓDIGO PERMANECE IGUAL, SÓ O FETCH MUDOU ---

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
      // Salva os IDs numéricos originais para manter consistência
      const completedIds = completedExercises.map(index => training.exercises[index].id);

      const checkInData = {
        userId: user.uid,
        userEmail: user.email,
        trainingId: training.id, // Salva o ID numérico (ex: 1)
        trainingFirestoreId: training.firestoreId, // Salva também o hash por segurança
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
        <p className="text-xl text-gray-600 dark:text-gray-300">Carregando treino...</p>
      </div>
    );
  }

  if (!training) return null;

  const currentExercise = training.exercises[activeExerciseIndex];
  if (!currentExercise) return <div className="p-8 text-center dark:text-white">Nenhum exercício encontrado.</div>;

  const progress = Math.round((completedExercises.length / training.exercises.length) * 100);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 pb-20 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg mb-6 sticky top-4 z-10 transition-colors">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-lg font-bold text-gray-800 dark:text-white truncate pr-2">{training.name}</h1>
            <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg">
              {formatTime(timer)}
            </div>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-right text-gray-500 dark:text-gray-400 mt-1">
            {completedExercises.length}/{training.exercises.length} concluídos
          </p>
        </div>

        {/* Card do Exercício */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-colors border border-gray-100 dark:border-gray-700">
          <div className="relative h-64 bg-gray-200 dark:bg-gray-700">
            <img 
              src={currentExercise.machineImage} 
              alt={currentExercise.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x300?text=Sem+Imagem';
              }}
            />
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-bold">
              {activeExerciseIndex + 1} / {training.exercises.length}
            </div>
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

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="block text-2xl font-bold text-blue-600 dark:text-blue-400">{currentExercise.sets}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Séries</span>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="block text-2xl font-bold text-blue-600 dark:text-blue-400">{currentExercise.reps}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Reps</span>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="block text-2xl font-bold text-blue-600 dark:text-blue-400">{currentExercise.rest}s</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Descanso</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">ℹ️ Instruções</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{currentExercise.description}</p>
              </div>
            </div>
          </div>

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
    </div>
  );
}