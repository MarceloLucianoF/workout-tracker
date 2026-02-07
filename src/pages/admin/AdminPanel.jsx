import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';
import { useAdmin } from '../../hooks/useAdmin';
import { Navigate } from 'react-router-dom';

export default function AdminPanel() {
  const { isAdmin, loading: authLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState('exercises');
  
  const [exercises, setExercises] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE EDIÇÃO ---
  const [editingId, setEditingId] = useState(null); // ID do item sendo editado (null = criando novo)

  // Forms
  const initialExForm = { name: '', muscleGroup: '', machineImage: '', videoUrl: '', sets: 3, reps: '12', rest: 60 };
  const [exForm, setExForm] = useState(initialExForm);
  
  const initialTrainingForm = { name: '', description: '', difficulty: 'Iniciante' };
  const [trainingForm, setTrainingForm] = useState(initialTrainingForm);
  const [selectedExercises, setSelectedExercises] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const exSnap = await getDocs(collection(db, 'exercises'));
      const trSnap = await getDocs(collection(db, 'trainings'));
      
      setExercises(exSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => a.name.localeCompare(b.name)));
      setTrainings(trSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE EXERCÍCIOS ---
  
  const handleSaveExercise = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // MODO EDIÇÃO
        await updateDoc(doc(db, 'exercises', editingId), exForm);
        toast.success('Exercício atualizado!');
      } else {
        // MODO CRIAÇÃO
        await addDoc(collection(db, 'exercises'), exForm);
        toast.success('Exercício criado!');
      }
      resetExerciseForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar exercício.');
    }
  };

  const handleEditExercise = (ex) => {
    setExForm(ex);
    setEditingId(ex.id);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola pra cima pro formulário
  };

  const resetExerciseForm = () => {
    setExForm(initialExForm);
    setEditingId(null);
  };

  const handleDeleteExercise = async (id) => {
    if(!window.confirm("Apagar este exercício?")) return;
    try {
        await deleteDoc(doc(db, 'exercises', id));
        toast.success("Apagado.");
        fetchData();
    } catch (e) { toast.error("Erro ao apagar"); }
  };

  // --- LÓGICA DE TREINOS ---

  const handleSaveTraining = async (e) => {
    e.preventDefault();
    if (selectedExercises.length === 0) return toast.error("Selecione exercícios!");

    try {
      const payload = {
        ...trainingForm,
        exercises: selectedExercises,
        updatedAt: new Date()
      };

      if (editingId) {
        // UPDATE
        await updateDoc(doc(db, 'trainings', editingId), payload);
        toast.success('Treino atualizado!');
      } else {
        // CREATE
        payload.createdAt = new Date();
        await addDoc(collection(db, 'trainings'), payload);
        toast.success('Treino criado!');
      }
      resetTrainingForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar treino.');
    }
  };

  const handleEditTraining = (tr) => {
    setTrainingForm({
        name: tr.name,
        description: tr.description,
        difficulty: tr.difficulty
    });
    setSelectedExercises(tr.exercises || []);
    setEditingId(tr.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetTrainingForm = () => {
    setTrainingForm(initialTrainingForm);
    setSelectedExercises([]);
    setEditingId(null);
  };

  const handleDeleteTraining = async (id) => {
      if(!window.confirm("Apagar este treino?")) return;
      try {
          await deleteDoc(doc(db, 'trainings', id));
          toast.success("Treino removido.");
          fetchData();
      } catch (e) { toast.error("Erro ao apagar"); }
  };

  const toggleExerciseSelection = (exId) => {
    if (selectedExercises.includes(exId)) {
        setSelectedExercises(prev => prev.filter(id => id !== exId));
    } else {
        setSelectedExercises(prev => [...prev, exId]);
    }
  };

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/home" />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pb-24 transition-colors">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Painel do Treinador 🧢</h1>
        <p className="text-gray-500 mb-8">Gerencie o conteúdo do aplicativo.</p>

        {/* Abas */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-700">
            <button 
                onClick={() => { setActiveTab('exercises'); resetTrainingForm(); }}
                className={`pb-4 px-4 font-bold transition-colors ${activeTab === 'exercises' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
                1. Gerenciar Exercícios
            </button>
            <button 
                onClick={() => { setActiveTab('trainings'); resetExerciseForm(); }}
                className={`pb-4 px-4 font-bold transition-colors ${activeTab === 'trainings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
                2. Montar Treinos
            </button>
        </div>

        {/* --- ABA EXERCÍCIOS --- */}
        {activeTab === 'exercises' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                {/* Formuário */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit sticky top-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-xl text-gray-800 dark:text-white">
                            {editingId ? 'Editar Exercício' : 'Novo Exercício'}
                        </h3>
                        {editingId && (
                            <button onClick={resetExerciseForm} className="text-xs text-red-500 hover:underline">Cancelar Edição</button>
                        )}
                    </div>
                    
                    <form onSubmit={handleSaveExercise} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Nome</label>
                            <input required type="text" value={exForm.name} onChange={e => setExForm({...exForm, name: e.target.value})} className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Ex: Supino Reto" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Grupo Muscular</label>
                            <select required value={exForm.muscleGroup} onChange={e => setExForm({...exForm, muscleGroup: e.target.value})} className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="">Selecione...</option>
                                <option value="peito">Peito</option>
                                <option value="costas">Costas</option>
                                <option value="pernas">Pernas</option>
                                <option value="ombros">Ombros</option>
                                <option value="braços">Braços</option>
                                <option value="core">Core</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                             <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Séries</label>
                                <input type="number" value={exForm.sets} onChange={e => setExForm({...exForm, sets: e.target.value})} className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                             </div>
                             <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Reps</label>
                                <input type="text" value={exForm.reps} onChange={e => setExForm({...exForm, reps: e.target.value})} className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                             </div>
                             <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Rest(s)</label>
                                <input type="number" value={exForm.rest} onChange={e => setExForm({...exForm, rest: e.target.value})} className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                             </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">URL do GIF</label>
                            <input type="url" value={exForm.machineImage} onChange={e => setExForm({...exForm, machineImage: e.target.value})} className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="https://..." />
                        </div>
                        
                        <button type="submit" className={`w-full text-white font-bold py-3 rounded-xl transition-colors ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}>
                            {editingId ? 'Atualizar Exercício 💾' : '+ Cadastrar Exercício'}
                        </button>
                    </form>
                </div>

                {/* Lista */}
                <div className="lg:col-span-2 space-y-3">
                    <h3 className="font-bold text-gray-800 dark:text-white">Banco de Exercícios ({exercises.length})</h3>
                    {exercises.map(ex => (
                        <div key={ex.id} className={`bg-white dark:bg-gray-800 p-4 rounded-xl border flex justify-between items-center group ${editingId === ex.id ? 'border-orange-400 ring-1 ring-orange-400' : 'border-gray-100 dark:border-gray-700'}`}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                                    {ex.machineImage ? <img src={ex.machineImage} className="w-full h-full object-cover" alt="" /> : <span className="flex items-center justify-center h-full text-xs">IMG</span>}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 dark:text-white">{ex.name}</h4>
                                    <p className="text-xs text-gray-500 uppercase">{ex.muscleGroup} • {ex.sets}x{ex.reps}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEditExercise(ex)} className="text-gray-400 hover:text-blue-500 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    ✏️
                                </button>
                                <button onClick={() => handleDeleteExercise(ex.id)} className="text-gray-400 hover:text-red-500 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- ABA TREINOS --- */}
        {activeTab === 'trainings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                
                {/* Construtor */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit sticky top-6">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-xl text-gray-800 dark:text-white">
                            {editingId ? 'Editar Ficha' : 'Criar Nova Ficha'}
                        </h3>
                        {editingId && (
                            <button onClick={resetTrainingForm} className="text-xs text-red-500 hover:underline">Cancelar Edição</button>
                        )}
                    </div>
                     
                     <form onSubmit={handleSaveTraining} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Nome do Treino</label>
                            <input required type="text" value={trainingForm.name} onChange={e => setTrainingForm({...trainingForm, name: e.target.value})} className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Ex: Treino A" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Descrição</label>
                            <textarea value={trainingForm.description} onChange={e => setTrainingForm({...trainingForm, description: e.target.value})} className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Dificuldade</label>
                            <select value={trainingForm.difficulty} onChange={e => setTrainingForm({...trainingForm, difficulty: e.target.value})} className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="Iniciante">Iniciante</option>
                                <option value="Intermediário">Intermediário</option>
                                <option value="Avançado">Avançado</option>
                            </select>
                        </div>

                        {/* Seleção */}
                        <div className="mt-4">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Exercícios ({selectedExercises.length})</label>
                            <div className="h-60 overflow-y-auto border dark:border-gray-700 rounded-xl p-2 space-y-1 bg-gray-50 dark:bg-gray-900">
                                {exercises.map(ex => (
                                    <div 
                                        key={ex.id} 
                                        onClick={() => toggleExerciseSelection(ex.id)}
                                        className={`p-2 rounded-lg cursor-pointer text-sm flex justify-between items-center transition-colors ${
                                            selectedExercises.includes(ex.id) 
                                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold' 
                                            : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        <span>{ex.name}</span>
                                        {selectedExercises.includes(ex.id) && <span>✅</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className={`w-full text-white font-bold py-3 rounded-xl transition-colors ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            {editingId ? 'Atualizar Ficha 💾' : 'Salvar Ficha 💾'}
                        </button>
                     </form>
                </div>

                {/* Lista */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 dark:text-white">Fichas Ativas ({trainings.length})</h3>
                    {trainings.map(tr => (
                        <div key={tr.id} className={`bg-white dark:bg-gray-800 p-5 rounded-xl border shadow-sm ${editingId === tr.id ? 'border-orange-400 ring-1 ring-orange-400' : 'border-gray-100 dark:border-gray-700'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-lg text-gray-800 dark:text-white">{tr.name}</h4>
                                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-bold text-gray-600 dark:text-gray-300">{tr.difficulty}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditTraining(tr)} className="text-gray-400 hover:text-blue-500 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                                        ✏️
                                    </button>
                                    <button onClick={() => handleDeleteTraining(tr.id)} className="text-gray-400 hover:text-red-500 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Exercícios:</p>
                                <div className="flex flex-wrap gap-2">
                                    {tr.exercises?.map(exId => {
                                        const ex = exercises.find(e => e.id === exId);
                                        return ex ? (
                                            <span key={exId} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-2 py-1 rounded border border-blue-100 dark:border-blue-900">
                                                {ex.name}
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        )}

      </div>
    </div>
  );
}