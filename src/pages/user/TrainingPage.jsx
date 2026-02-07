import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// CORREÇÃO: Importamos 'doc' e 'getDoc' novamente, removemos 'query' e 'where'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';
import GifPlayer from '../../components/common/GifPlayer';

export default function TrainingPage() {
  const { trainingId } = useParams(); // Agora isso aqui é o ID do Firestore (ex: "Abc123Xyz")
  const navigate = useNavigate();

  const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);

  useEffect(() => {
    const fetchTrainingData = async () => {
      try {
        // CORREÇÃO: Busca direta pelo ID do Documento (muito mais seguro e rápido)
        const docRef = doc(db, 'trainings', trainingId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          toast.error('Treino não encontrado');
          navigate('/trainings');
          return;
        }

        const trainingData = docSnap.data();

        // Busca exercícios para cruzar dados
        const exercisesSnap = await getDocs(collection(db, 'exercises'));
        const allExercises = exercisesSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));

        const hydratedExercises = (trainingData.exercises || [])
          .map(id => allExercises.find(ex => ex.id === id))
          .filter(Boolean);

        // Guardamos o ID do firestore para passar para a próxima tela
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

  const handleStartTraining = () => {
    if (training && training.firestoreId) {
      // CORREÇÃO: Passamos o firestoreId para a execução
      navigate(`/execution/${training.firestoreId}`);
    } else {
      toast.error("Erro: ID do treino inválido");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (!training) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-300">
      <div className="max-w-3xl mx-auto pb-28">
        
        <button onClick={() => navigate('/trainings')} className="mb-4 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white flex items-center transition-colors">
          ← Voltar para lista
        </button>

        {/* Card Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-6 border border-gray-100 dark:border-gray-700">
          <div className="bg-blue-600 dark:bg-blue-800 p-6 text-white">
            <h1 className="text-3xl font-bold">{training.name}</h1>
            <div className="flex gap-3 mt-2 text-blue-100 text-sm font-medium">
              <span className="bg-white/20 px-2 py-1 rounded capitalize">{training.difficulty}</span>
              <span className="bg-white/20 px-2 py-1 rounded">{training.exerciseList?.length} Exercícios</span>
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
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 group"
            >
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                   <GifPlayer src={exercise.machineImage} alt={exercise.name} className="w-full h-full object-cover" />
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
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botão Flutuante */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-100 via-gray-100 to-transparent dark:from-gray-900 dark:via-gray-900 z-10 flex justify-center">
        <button
          onClick={handleStartTraining}
          className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-4 px-12 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
        >
          <span>▶️</span> INICIAR TREINO
        </button>
      </div>

      {/* Modal Detalhes */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="relative h-56 bg-gray-200 dark:bg-gray-700">
               <img src={selectedExercise.machineImage} alt={selectedExercise.name} className="w-full h-full object-cover" />
               <button onClick={() => setSelectedExercise(null)} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center transition">✕</button>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{selectedExercise.name}</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">{selectedExercise.execution}</p>
              <button onClick={() => setSelectedExercise(null)} className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-3 rounded-xl font-bold transition">Entendi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}