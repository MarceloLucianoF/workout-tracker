import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuthContext } from '../../hooks/AuthContext';
import toast from 'react-hot-toast';
import GifPlayer from '../../components/common/GifPlayer';

export default function TrainingPage() {
  const { trainingId } = useParams();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastWorkoutDate, setLastWorkoutDate] = useState(null);

  // Estados de Personalização (Drag & Drop + Checkbox)
  const [exerciseList, setExerciseList] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState({}); // { id: true/false }
  
  // Drag & Drop Refs
  const dragItem = useRef();
  const dragOverItem = useRef();

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
          .map(exId => {
             const idStr = String(exId);
             return allExercises.find(e => 
                String(e.firestoreId) === idStr || String(e.originalId) === idStr || String(e.id) === idStr
             );
          })
          .filter(Boolean);

        setTraining({ ...trainingData, firestoreId: docSnap.id });
        setExerciseList(hydratedExercises);
        
        // Inicializa todos selecionados
        const initialSelection = {};
        hydratedExercises.forEach((ex, i) => initialSelection[i] = true);
        setSelectedExercises(initialSelection);

        // Histórico
        const q = query(
            collection(db, 'checkIns'), 
            where('userId', '==', user.uid),
            where('trainingId', '==', docSnap.id),
            orderBy('date', 'desc')
        );
        const historySnap = await getDocs(q);
        if(!historySnap.empty) setLastWorkoutDate(new Date(historySnap.docs[0].data().date));

      } catch (error) {
        console.error("Erro:", error);
        toast.error('Erro ao carregar');
      } finally {
        setLoading(false);
      }
    };

    fetchTrainingData();
  }, [trainingId, navigate, user]);

  // Funções Drag & Drop
  const dragStart = (e, position) => {
    dragItem.current = position;
  };

  const dragEnter = (e, position) => {
    dragOverItem.current = position;
  };

  const drop = () => {
    const copyListItems = [...exerciseList];
    const dragItemContent = copyListItems[dragItem.current];
    copyListItems.splice(dragItem.current, 1);
    copyListItems.splice(dragOverItem.current, 0, dragItemContent);
    
    // Atualiza indices da seleção também, mas pra simplificar, vamos resetar seleção ou manter lógica complexa
    // Simplificação: Mantemos a lista reordenada e atualizamos o estado
    dragItem.current = null;
    dragOverItem.current = null;
    setExerciseList(copyListItems);
    
    // Reconstrói chaves de seleção baseada na nova ordem (resetando pra true pra evitar bugs de indice)
    const newSelection = {};
    copyListItems.forEach((_, i) => newSelection[i] = true);
    setSelectedExercises(newSelection);
  };

  const toggleSelection = (index) => {
      setSelectedExercises(prev => ({...prev, [index]: !prev[index]}));
  };

  const handleStartTraining = () => {
    if (training && training.firestoreId) {
      // Filtra apenas os selecionados na ordem atual
      const activeExercises = exerciseList.filter((_, i) => selectedExercises[i]);
      
      if (activeExercises.length === 0) {
          toast.error("Selecione pelo menos um exercício!");
          return;
      }

      // Passa a lista personalizada via State do Router
      navigate(`/execution/${training.firestoreId}`, { 
          state: { customExerciseList: activeExercises } 
      });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (!training) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
        
        {/* Header Compacto com Descrição */}
        <div className="bg-white dark:bg-gray-800 p-6 pt-8 pb-8 shadow-sm border-b border-gray-100 dark:border-gray-700">
            <button onClick={() => navigate('/trainings')} className="mb-4 text-sm font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center gap-1">
                ← Voltar
            </button>
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 dark:text-white leading-tight mb-2">{training.name}</h1>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                        {training.description || "Prepare-se para o treino."}
                    </p>
                </div>
                {lastWorkoutDate && (
                    <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Última vez</p>
                        <p className="text-xs font-bold text-green-600 dark:text-green-400">{lastWorkoutDate.toLocaleDateString('pt-BR')}</p>
                    </div>
                )}
            </div>
        </div>

        {/* Lista de Exercícios (Sortable) */}
        <div className="p-4 max-w-3xl mx-auto">
            
            {/* Dica Visual */}
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Roteiro ({exerciseList.filter((_,i) => selectedExercises[i]).length})
                </h2>
                <div className="text-[10px] text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded font-bold flex items-center gap-1">
                    <span>⇅</span> Arraste para organizar
                </div>
            </div>

            <div className="space-y-3">
                {exerciseList.map((exercise, index) => (
                    <div 
                        key={index}
                        draggable
                        onDragStart={(e) => dragStart(e, index)}
                        onDragEnter={(e) => dragEnter(e, index)}
                        onDragEnd={drop}
                        className={`flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border transition-all cursor-move active:scale-[0.98] ${
                            !selectedExercises[index] ? 'opacity-50 border-transparent' : 'border-gray-100 dark:border-gray-700'
                        }`}
                    >
                        {/* Checkbox Customizado */}
                        <div 
                            onClick={(e) => { e.stopPropagation(); toggleSelection(index); }}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                                selectedExercises[index] 
                                ? 'bg-blue-500 border-blue-500 text-white' 
                                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                            }`}
                        >
                            {selectedExercises[index] && <span className="text-xs font-bold">✓</span>}
                        </div>

                        {/* Imagem */}
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shrink-0">
                            <GifPlayer src={exercise.machineImage} className="w-full h-full object-cover opacity-90" />
                        </div>

                        {/* Textos */}
                        <div className="flex-1 min-w-0 select-none">
                            <h3 className="font-bold text-gray-800 dark:text-white truncate text-sm">{exercise.name}</h3>
                            <div className="flex gap-2 text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                                <span>{exercise.sets} Séries</span>
                                <span>{exercise.reps} Reps</span>
                            </div>
                        </div>

                        {/* Ícone de Drag (Hambúrguer) */}
                        <div className="text-gray-300 dark:text-gray-600 px-2 cursor-grab active:cursor-grabbing">
                            ☰
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Botão Iniciar Fixo */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-40 pb-safe">
            <button 
                onClick={handleStartTraining}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                <span>🔥</span> INICIAR TREINO
            </button>
        </div>
    </div>
  );
}