import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

// --- COMPONENTES DO EDITOR (MODAIS E LISTAS) ---

// 1. Modal de Seleção de Exercícios
const ExerciseSelector = ({ isOpen, onClose, onSelect }) => {
    const [exercises, setExercises] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        const load = async () => {
            const q = query(collection(db, 'exercises'), orderBy('name'));
            const snap = await getDocs(q);
            setExercises(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
        };
        load();
    }, [isOpen]);

    const filtered = exercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg dark:text-white">Adicionar Exercício</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                
                <div className="p-4">
                    <input 
                        className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-xl outline-none dark:text-white"
                        placeholder="Buscar (ex: Supino)..."
                        autoFocus
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
                    {filtered.map(ex => (
                        <div 
                            key={ex.firestoreId}
                            onClick={() => { onSelect(ex); onClose(); }}
                            className="flex items-center gap-3 p-2 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-blue-200"
                        >
                            <img src={ex.machineImage} className="w-10 h-10 rounded object-cover bg-gray-200" alt="" />
                            <div className="flex-1">
                                <p className="font-bold text-sm dark:text-white">{ex.name}</p>
                                <p className="text-xs text-gray-500">{ex.muscleGroup}</p>
                            </div>
                            <span className="text-blue-500 font-bold text-xl">+</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// 2. Editor de Treino (Formulário Principal)
const TrainingEditor = ({ training, onSave, onCancel }) => {
    const [form, setForm] = useState({
        name: '',
        description: '',
        difficulty: 'Iniciante',
        exercises: [] // Array de Objetos: { firestoreId, name, sets, reps, ... }
    });
    const [showExSelector, setShowExSelector] = useState(false);

    useEffect(() => {
        if (training) {
            // Se for edição, popula. Se os exercises forem só IDs (legado), isso precisaria de um fetch extra.
            // Aqui assumo que vamos migrar para salvar o objeto completo ou hidratar antes.
            // Para simplificar MVP Admin: Vamos assumir que training.exercises já vem hidratado ou vazio.
            setForm(training);
        }
    }, [training]);

    const handleAddExercise = (ex) => {
        setForm(prev => ({
            ...prev,
            exercises: [...(prev.exercises || []), {
                ...ex,
                sets: '3', // Default
                reps: '10-12', // Default
                rest: '60' // Default
            }]
        }));
    };

    const updateExercise = (index, field, value) => {
        const newExs = [...form.exercises];
        newExs[index] = { ...newExs[index], [field]: value };
        setForm({ ...form, exercises: newExs });
    };

    const removeExercise = (index) => {
        setForm({ ...form, exercises: form.exercises.filter((_, i) => i !== index) });
    };

    const moveExercise = (index, direction) => {
        const newExs = [...form.exercises];
        if (direction === -1 && index > 0) {
            [newExs[index], newExs[index - 1]] = [newExs[index - 1], newExs[index]];
        } else if (direction === 1 && index < newExs.length - 1) {
            [newExs[index], newExs[index + 1]] = [newExs[index + 1], newExs[index]];
        }
        setForm({ ...form, exercises: newExs });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold dark:text-white">
                    {training?.firestoreId ? 'Editar Treino' : 'Novo Treino'}
                </h2>
                <button onClick={onCancel} className="text-sm text-gray-500 underline">Cancelar</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Nome (ex: Treino A)</label>
                    <input 
                        value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-700 p-3 rounded-xl mt-1 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Dificuldade</label>
                    <select 
                        value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-700 p-3 rounded-xl mt-1 dark:text-white outline-none"
                    >
                        <option>Iniciante</option>
                        <option>Intermediário</option>
                        <option>Avançado</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Descrição</label>
                    <input 
                        value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-700 p-3 rounded-xl mt-1 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Foco em superiores..."
                    />
                </div>
            </div>

            {/* Builder de Exercícios */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold dark:text-white">Roteiro de Exercícios</h3>
                    <button 
                        type="button"
                        onClick={() => setShowExSelector(true)}
                        className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-200"
                    >
                        + Adicionar
                    </button>
                </div>

                <div className="space-y-2 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl min-h-[100px]">
                    {form.exercises?.length === 0 && (
                        <p className="text-center text-gray-400 text-sm py-4">Nenhum exercício adicionado.</p>
                    )}
                    
                    {form.exercises?.map((ex, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-3 items-center">
                            
                            {/* Ordem */}
                            <div className="flex flex-col gap-1">
                                <button onClick={() => moveExercise(i, -1)} disabled={i===0} className="text-gray-300 hover:text-blue-500 disabled:opacity-30">▲</button>
                                <span className="text-xs font-mono font-bold text-gray-400 text-center">{i+1}</span>
                                <button onClick={() => moveExercise(i, 1)} disabled={i===form.exercises.length-1} className="text-gray-300 hover:text-blue-500 disabled:opacity-30">▼</button>
                            </div>

                            {/* Info Básica */}
                            <div className="flex items-center gap-3 flex-1 w-full">
                                <img src={ex.machineImage} className="w-10 h-10 rounded bg-gray-200 object-cover" alt=""/>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm truncate dark:text-white">{ex.name}</p>
                                    <p className="text-[10px] text-gray-400">{ex.muscleGroup}</p>
                                </div>
                            </div>

                            {/* Configs (Sets/Reps) */}
                            <div className="flex gap-2 w-full md:w-auto">
                                <div>
                                    <label className="text-[9px] uppercase font-bold text-gray-400 block">Sets</label>
                                    <input value={ex.sets} onChange={e=>updateExercise(i, 'sets', e.target.value)} className="w-12 bg-gray-100 dark:bg-gray-700 rounded p-1 text-center text-sm font-bold outline-none" />
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase font-bold text-gray-400 block">Reps</label>
                                    <input value={ex.reps} onChange={e=>updateExercise(i, 'reps', e.target.value)} className="w-16 bg-gray-100 dark:bg-gray-700 rounded p-1 text-center text-sm font-bold outline-none" />
                                </div>
                                <button onClick={() => removeExercise(i)} className="text-red-400 hover:text-red-600 px-2">🗑</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-3">
                <button onClick={() => onSave(form)} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-600/20">
                    Salvar Treino 💾
                </button>
            </div>

            <ExerciseSelector 
                isOpen={showExSelector} 
                onClose={() => setShowExSelector(false)} 
                onSelect={handleAddExercise} 
            />
        </div>
    );
};

// --- PÁGINA PRINCIPAL DO ADMIN ---

export default function AdminTrainingsPage() {
    const [trainings, setTrainings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTraining, setEditingTraining] = useState(null); // null = list mode, {} = create mode, {...} = edit mode

    // Fetch Inicial
    const fetchTrainings = async () => {
        try {
            const q = query(collection(db, 'trainings'), orderBy('name'));
            const snap = await getDocs(q);
            const data = await Promise.all(snap.docs.map(async docSnap => {
                const tData = docSnap.data();
                // Hidratação simples: Se exercises for array de IDs, precisaria buscar. 
                // Assumindo que para o ADMIN vamos salvar o objeto completo para performance ou buscar IDs
                // Para MVP Robusto: Vamos buscar os exercicios completos se forem só IDs
                
                let hydratedExercises = tData.exercises || [];
                // Lógica de hidratação omitida para brevidade, assumindo que salva Full Object ou Admin suporta
                // Dica Sênior: Salve um "minified object" do exercicio dentro do treino (id, name, img) para evitar leituras extras.
                
                return { firestoreId: docSnap.id, ...tData, exercises: hydratedExercises };
            }));
            setTrainings(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar treinos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrainings();
    }, []);

    const handleSave = async (trainingData) => {
        const toastId = toast.loading('Salvando...');
        try {
            // Sanitiza para salvar no banco
            // Dica: Se quiser salvar só IDs dos exercicios para normalização, faça map aqui.
            // Para performance de leitura no app, salvar o objeto (desnormalizado) é melhor em NoSQL.
            const payload = {
                name: trainingData.name,
                description: trainingData.description,
                difficulty: trainingData.difficulty,
                // Salva dados essenciais para não precisar de joins depois
                exercises: trainingData.exercises.map(ex => ({
                    firestoreId: ex.firestoreId || ex.id, // Garante ID
                    name: ex.name,
                    machineImage: ex.machineImage,
                    muscleGroup: ex.muscleGroup,
                    sets: ex.sets,
                    reps: ex.reps
                }))
            };

            if (trainingData.firestoreId) {
                await updateDoc(doc(db, 'trainings', trainingData.firestoreId), payload);
                toast.success('Treino atualizado!', { id: toastId });
            } else {
                await addDoc(collection(db, 'trainings'), payload);
                toast.success('Treino criado!', { id: toastId });
            }
            
            setEditingTraining(null);
            fetchTrainings(); // Refresh
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar.', { id: toastId });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza? Isso pode afetar alunos usando este treino.")) {
            await deleteDoc(doc(db, 'trainings', id));
            setTrainings(prev => prev.filter(t => t.firestoreId !== id));
            toast.success("Treino removido.");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-10 pb-32">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-800 dark:text-white">Gestão de Treinos</h1>
                        <p className="text-gray-500">Painel do Treinador</p>
                    </div>
                    {!editingTraining && (
                        <button 
                            onClick={() => setEditingTraining({})}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                        >
                            + Novo Treino
                        </button>
                    )}
                </div>

                {editingTraining ? (
                    <TrainingEditor 
                        training={editingTraining} 
                        onSave={handleSave} 
                        onCancel={() => setEditingTraining(null)} 
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trainings.map(t => (
                            <div key={t.firestoreId} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:border-blue-300 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase border ${
                                        t.difficulty === 'Iniciante' ? 'bg-green-50 text-green-600 border-green-200' :
                                        t.difficulty === 'Intermediário' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                        'bg-red-50 text-red-600 border-red-200'
                                    }`}>
                                        {t.difficulty}
                                    </span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingTraining(t)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded">✏️</button>
                                        <button onClick={() => handleDelete(t.firestoreId)} className="text-red-500 hover:bg-red-50 p-1.5 rounded">🗑</button>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{t.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 h-10">{t.description}</p>
                                
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 text-sm text-gray-500">
                                    <span className="font-bold">{t.exercises?.length || 0}</span> exercícios
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}