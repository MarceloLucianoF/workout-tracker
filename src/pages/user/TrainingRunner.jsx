import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuthContext } from '../../hooks/AuthContext';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti'; // Se não tiver, ele ignora ou instale: npm install canvas-confetti

// Componente de Timer de Descanso
const RestTimer = ({ initialSeconds, onFinish, onClose }) => {
    const [seconds, setSeconds] = useState(initialSeconds);

    useEffect(() => {
        if (seconds <= 0) {
            onFinish();
            return;
        }
        const timer = setInterval(() => setSeconds(s => s - 1), 1000);
        return () => clearInterval(timer);
    }, [seconds]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
            <div className="text-center text-white">
                <p className="text-sm font-bold uppercase tracking-widest mb-4 opacity-70">Descansando</p>
                <div className="text-8xl font-black font-mono mb-8 tabular-nums">
                    {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
                </div>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => setSeconds(s => s + 10)} className="px-6 py-3 bg-white/10 rounded-full font-bold">+10s</button>
                    <button onClick={onClose} className="px-6 py-3 bg-red-600 rounded-full font-bold">Pular</button>
                </div>
            </div>
        </div>
    );
};

export default function TrainingRunner() {
    const { trainingId } = useParams();
    const { user } = useAuthContext();
    const navigate = useNavigate();

    const [training, setTraining] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Estado da Execução
    const [elapsedTime, setElapsedTime] = useState(0); // Segundos totais
    const [restTimer, setRestTimer] = useState(null); // null ou segundos
    const [activeExerciseIndex, setActiveExerciseIndex] = useState(0); // Foco no exercício atual (opcional)
    
    // Armazena o input do usuário: { "exIndex-setIndex": { weight: 20, reps: 12, completed: true } }
    const [sessionData, setSessionData] = useState({});

    // 1. Inicialização e Cronômetro Global
    useEffect(() => {
        const fetchTraining = async () => {
            try {
                const docRef = doc(db, 'trainings', trainingId);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    setTraining({ id: docSnap.id, ...docSnap.data() });
                } else {
                    toast.error("Treino não encontrado.");
                    navigate('/home');
                }
            } catch (error) {
                console.error(error);
                toast.error("Erro ao carregar.");
            } finally {
                setLoading(false);
            }
        };
        fetchTraining();

        // Timer Global do Treino
        const globalTimer = setInterval(() => setElapsedTime(t => t + 1), 1000);
        return () => clearInterval(globalTimer);
    }, [trainingId, navigate]);

    // 2. Manipular Check de Série
    const handleCheckSet = (exIndex, setIndex, targetReps) => {
        const key = `${exIndex}-${setIndex}`;
        const current = sessionData[key] || {};
        const isCompleting = !current.completed;

        // Atualiza estado
        setSessionData(prev => ({
            ...prev,
            [key]: {
                ...current,
                completed: isCompleting,
                // Se não preencheu carga/reps, assume o previsto (UX amigável) ou mantém vazio
                reps: current.reps || targetReps, 
                weight: current.weight || ''
            }
        }));

        // Se completou, dispara descanso
        if (isCompleting) {
            setRestTimer(60); // 60s padrão, poderia vir do exercício
            
            // Som de sucesso (opcional)
            // const audio = new Audio('/sounds/success.mp3'); audio.play().catch(()=>{}); 
        }
    };

    // 3. Atualizar Inputs (Carga/Reps)
    const handleInput = (exIndex, setIndex, field, value) => {
        const key = `${exIndex}-${setIndex}`;
        setSessionData(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    // 4. Finalizar Treino (O CORAÇÃO DO SISTEMA)
    const finishWorkout = async () => {
        if (!window.confirm("Finalizar o treino agora?")) return;

        const loadingToast = toast.loading("Salvando progresso...");
        
        try {
            // Calcular Volume Total (Carga * Reps) para o Coach ver evolução
            let totalVolume = 0;
            let setsCompleted = 0;

            Object.values(sessionData).forEach(set => {
                if (set.completed) {
                    const w = parseFloat(set.weight) || 0;
                    const r = parseFloat(set.reps) || 0;
                    totalVolume += w * r;
                    setsCompleted++;
                }
            });

            // Payload para o CheckIn (Histórico)
            const checkInPayload = {
                userId: user.uid,
                userEmail: user.email,
                userPhoto: user.photoURL || null,
                trainingId: training.id,
                trainingName: training.name,
                coachId: training.coachId, // Importante para o dashboard do coach
                date: new Date().toISOString(),
                duration: elapsedTime, // Segundos
                totalVolume,
                setsCompleted,
                sessionData, // Detalhe técnico se precisar auditar
                createdAt: serverTimestamp()
            };

            // Salva no Firestore
            await addDoc(collection(db, 'checkIns'), checkInPayload);

            // Atualiza "Last Workout" no User (para cálculo de inatividade)
            await updateDoc(doc(db, 'users', user.uid), {
                lastWorkoutDate: new Date().toISOString()
            });

            // Efeito Visual
            try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch(e){}

            toast.success("Treino concluído! 💪", { id: loadingToast });
            navigate('/home');

        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar.", { id: loadingToast });
        }
    };

    if (loading || !training) return <div className="h-screen bg-gray-900 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32 transition-colors">
            
            {/* Header Fixo - Timer */}
            <div className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md z-40 px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="font-bold text-gray-800 dark:text-white text-sm leading-tight">{training.name}</h2>
                    <p className="text-[10px] text-gray-500">{training.difficulty}</p>
                </div>
                <div className="font-mono text-xl font-black text-blue-600 dark:text-blue-400">
                    {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                </div>
            </div>

            {/* Lista de Exercícios */}
            <div className="pt-20 px-4 max-w-2xl mx-auto space-y-6">
                {training.exercises?.map((ex, exIndex) => {
                    // Converter "sets: 3" (string do builder) para array [0, 1, 2]
                    const setsCount = parseInt(ex.sets) || 3;
                    const setsArray = Array.from({ length: setsCount });

                    return (
                        <div key={exIndex} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            
                            {/* Header Exercício */}
                            <div className="p-4 flex gap-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800">
                                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                                    {ex.machineImage ? <img src={ex.machineImage} className="w-full h-full object-cover" alt=""/> : <div className="h-full flex items-center justify-center text-2xl">🏋️</div>}
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-800 dark:text-white text-lg leading-tight">{ex.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1 uppercase font-bold">{ex.muscleGroup}</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        Meta: {ex.sets}x {ex.reps}
                                    </p>
                                </div>
                            </div>

                            {/* Lista de Séries */}
                            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {setsArray.map((_, setIndex) => {
                                    const key = `${exIndex}-${setIndex}`;
                                    const data = sessionData[key] || {};
                                    const isDone = data.completed;

                                    return (
                                        <div key={setIndex} className={`flex items-center gap-3 p-3 transition-colors ${isDone ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
                                            <div className="w-8 text-center">
                                                <span className="text-xs font-bold text-gray-400">#{setIndex + 1}</span>
                                            </div>
                                            
                                            <div className="flex-1 grid grid-cols-2 gap-2">
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        placeholder="kg"
                                                        value={data.weight || ''}
                                                        onChange={(e) => handleInput(exIndex, setIndex, 'weight', e.target.value)}
                                                        className={`w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-2 text-center font-bold outline-none text-sm ${isDone ? 'text-green-600' : 'dark:text-white'}`}
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold pointer-events-none">KG</span>
                                                </div>
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        placeholder={ex.reps} // Placeholder mostra a meta
                                                        value={data.reps || ''}
                                                        onChange={(e) => handleInput(exIndex, setIndex, 'reps', e.target.value)}
                                                        className={`w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-2 text-center font-bold outline-none text-sm ${isDone ? 'text-green-600' : 'dark:text-white'}`}
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold pointer-events-none">REPS</span>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => handleCheckSet(exIndex, setIndex, ex.reps)}
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-sm ${
                                                    isDone 
                                                    ? 'bg-green-500 text-white shadow-green-500/30' 
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                }`}
                                            >
                                                {isDone ? '✓' : ''}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Fixo - Botão Finalizar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40">
                <button 
                    onClick={finishWorkout}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-green-600/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                    <span>🏁</span> FINALIZAR TREINO
                </button>
            </div>

            {/* Timer Modal */}
            {restTimer && (
                <RestTimer 
                    initialSeconds={restTimer} 
                    onFinish={() => {
                        setRestTimer(null);
                        toast("Bora pra próxima! 🔥", { icon: '🔔' });
                    }} 
                    onClose={() => setRestTimer(null)} 
                />
            )}

        </div>
    );
}