import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
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

  // Estados de Personalização
  const [exerciseList, setExerciseList] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState({});
  const [historyMap, setHistoryMap] = useState({}); // { "Supino": 30 } (Última carga)
  
  // Drag & Drop Refs
  const dragItem = useRef();
  const dragOverItem = useRef();

  // 1. CARREGAMENTO DE DADOS
  useEffect(() => {
    const fetchTrainingData = async () => {
      try {
        // A. Busca Treino
        const docRef = doc(db, 'trainings', trainingId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          toast.error('Treino não encontrado');
          navigate('/trainings');
          return;
        }

        const trainingData = docSnap.data();
        
        // B. Busca Exercícios (Hidratação)
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
        
        // C. Inicializa Seleção (Todos marcados)
        const initialSelection = {};
        hydratedExercises.forEach((_, i) => initialSelection[i] = true);
        setSelectedExercises(initialSelection);

        // D. Busca Histórico (Para "Última Carga" e "Volume Estimado")
        const q = query(
            collection(db, 'checkIns'), 
            where('userId', '==', user.uid),
            orderBy('date', 'desc'),
            limit(10)
        );
        const historySnap = await getDocs(q);
        
        const loadMap = {};
        let foundLastDate = false;

        historySnap.docs.forEach(doc => {
            const data = doc.data();
            
            // Pega a data da última vez que ESSE treino específico foi feito
            if (!foundLastDate && data.trainingId === docSnap.id) {
                setLastWorkoutDate(new Date(data.date));
                foundLastDate = true;
            }

            // Mapeia cargas por nome de exercício
            if (data.exercises) {
                data.exercises.forEach(ex => {
                    if (!loadMap[ex.name]) {
                        const maxW = Math.max(...(ex.sets?.map(s => Number(s.weight) || 0) || [0]));
                        if (maxW > 0) loadMap[ex.name] = maxW;
                    }
                });
            }
        });
        setHistoryMap(loadMap);

      } catch (error) {
        console.error("Erro:", error);
        toast.error('Erro ao carregar');
      } finally {
        setLoading(false);
      }
    };

    fetchTrainingData();
  }, [trainingId, navigate, user]);

  // 2. PRÉ-LOAD DOS GIFS (Fluidez Absoluta)
  useEffect(() => {
    if (exerciseList.length > 0) {
        exerciseList.forEach(ex => {
            if (ex.machineImage) {
                const img = new Image();
                img.src = ex.machineImage;
            }
        });
    }
  }, [exerciseList]);

  // 3. LÓGICA DE DRAG & DROP
  const dragStart = (e, position) => {
    dragItem.current = position;
    e.dataTransfer.effectAllowed = "move";
  };

  const dragEnter = (e, position) => {
    dragOverItem.current = position;
  };

  const drop = () => {
    const copyListItems = [...exerciseList];
    const dragItemContent = copyListItems[dragItem.current];
    copyListItems.splice(dragItem.current, 1);
    copyListItems.splice(dragOverItem.current, 0, dragItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    setExerciseList(copyListItems);
    
    const newSelection = {};
    copyListItems.forEach((_, i) => newSelection[i] = true);
    setSelectedExercises(newSelection);
  };

  const toggleSelection = (index) => {
      setSelectedExercises(prev => ({...prev, [index]: !prev[index]}));
  };

  const handleStartTraining = () => {
    if (training && training.firestoreId) {
      const activeExercises = exerciseList.filter((_, i) => selectedExercises[i]);
      
      if (activeExercises.length === 0) {
          toast.error("Selecione pelo menos um exercício!");
          return;
      }

      navigate(`/execution/${training.firestoreId}`, { 
          state: { customExerciseList: activeExercises } 
      });
    }
  };

  const calculateEstimatedVolume = () => {
      let total = 0;
      exerciseList.forEach((ex, i) => {
          if (selectedExercises[i]) {
              const weight = historyMap[ex.name] || 0;
              const sets = Number(ex.sets) || 3;
              const reps = Number(ex.reps) || 10;
              total += weight * sets * reps;
          }
      });
      return total;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (!training) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-40"> {/* pb-40 para garantir scroll final */}
        
        {/* HEADER & INFO */}
        <div className="bg-white dark:bg-gray-800 p-6 pt-8 pb-6 shadow-sm border-b border-gray-100 dark:border-gray-700">
            <button onClick={() => navigate('/trainings')} className="mb-4 text-sm font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center gap-1 transition-colors">
                ← Voltar
            </button>
            
            <div className="flex justify-between items-start gap-4 mb-2">
                <h1 className="text-3xl font-black text-gray-800 dark:text-white leading-tight">{training.name}</h1>
                {lastWorkoutDate && (
                    <div className="text-right shrink-0 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg border border-green-100 dark:border-green-800/30">
                        <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase">Último Treino</p>
                        <p className="text-xs font-bold text-gray-700 dark:text-white">{lastWorkoutDate.toLocaleDateString('pt-BR')}</p>
                    </div>
                )}
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                {training.description || "Prepare-se para superar seus limites."}
            </p>

            {/* Badges de Resumo */}
            <div className="flex gap-3">
                <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300">
                    📋 {exerciseList.filter((_,i) => selectedExercises[i]).length} Exercícios
                </span>
                <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full text-xs font-bold text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30">
                    ⚖️ Vol. Est: {calculateEstimatedVolume() > 0 ? `${(calculateEstimatedVolume() / 1000).toFixed(1)}t` : '--'}
                </span>
            </div>
        </div>

        {/* LISTA DE EXERCÍCIOS */}
        <div className="p-4 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Roteiro Personalizável</h2>
                <div className="text-[10px] text-gray-400 flex items-center gap-1">
                    <span>Segure ☰ para mover</span>
                </div>
            </div>

            <div className="space-y-3">
                {exerciseList.map((exercise, index) => {
                    const isSelected = selectedExercises[index];
                    const lastLoad = historyMap[exercise.name];

                    return (
                        <div 
                            key={index}
                            draggable
                            onDragStart={(e) => dragStart(e, index)}
                            onDragEnter={(e) => dragEnter(e, index)}
                            onDragEnd={drop}
                            className={`flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border transition-all duration-200 ${
                                !isSelected 
                                ? 'opacity-60 border-transparent bg-gray-50 dark:bg-gray-800/50' 
                                : 'border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                            }`}
                        >
                            {/* 1. Checkbox */}
                            <div 
                                onClick={(e) => { e.stopPropagation(); toggleSelection(index); }}
                                className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all active:scale-90 ${
                                    isSelected 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/30' 
                                    : 'border-gray-300 dark:border-gray-600 bg-transparent'
                                }`}
                            >
                                {isSelected && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                            </div>

                            {/* 2. Imagem (GIF Nativo) */}
                            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-gray-600 relative">
                                <img 
                                    src={exercise.machineImage} 
                                    alt={exercise.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy" 
                                />
                                <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-tl-md backdrop-blur-sm">
                                    #{index + 1}
                                </div>
                            </div>

                            {/* 3. Infos */}
                            <div className="flex-1 min-w-0 select-none">
                                <h3 className={`font-bold text-sm truncate ${isSelected ? 'text-gray-800 dark:text-white' : 'text-gray-500'}`}>
                                    {exercise.name}
                                </h3>
                                
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-700/50 px-1.5 py-0.5 rounded">
                                        {exercise.sets} x {exercise.reps}
                                    </span>
                                    
                                    {/* Badge de Histórico */}
                                    {lastLoad && (
                                        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded border border-orange-100 dark:border-orange-800/30 flex items-center gap-1">
                                            ↺ {lastLoad}kg
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* 4. Drag Handle */}
                            <div className="text-gray-300 dark:text-gray-600 px-2 cursor-grab active:cursor-grabbing hover:text-gray-500 drag-handle">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"></path></svg>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* FOOTER FLUTUANTE (Z-Index Elevado) */}
        {/* Alterado para z-[60] e pb-8 para garantir visibilidade acima da navbar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-[60] pb-8 md:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <button 
                onClick={handleStartTraining}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-2xl shadow-xl shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
                <span className="group-hover:scale-110 transition-transform">🔥</span> 
                INICIAR TREINO 
                <span className="bg-blue-500 text-blue-100 text-xs py-0.5 px-2 rounded-md ml-2 group-hover:bg-blue-400 transition-colors">
                    Go!
                </span>
            </button>
        </div>
    </div>
  );
}