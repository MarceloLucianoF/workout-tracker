import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// --- MODAL DE PRESCRIÇÃO ---
const AssignWorkoutModal = ({ student, trainings, onClose, onAssign }) => {
    const [selectedTrainingId, setSelectedTrainingId] = useState(student?.currentTrainingId || '');

    const handleSave = () => {
        if (!selectedTrainingId) return toast.error("Selecione um treino");
        const training = trainings.find(t => t.firestoreId === selectedTrainingId);
        onAssign(student.uid, training);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Prescrever Treino</h3>
                <p className="text-sm text-gray-500 mb-6">Para: <span className="font-bold">{student.displayName}</span></p>

                <div className="space-y-3 mb-6">
                    <label className="text-xs font-bold text-gray-400 uppercase">Selecione a Ficha</label>
                    <select 
                        value={selectedTrainingId}
                        onChange={(e) => setSelectedTrainingId(e.target.value)}
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">-- Sem treino definido --</option>
                        {trainings.map(t => (
                            <option key={t.firestoreId} value={t.firestoreId}>
                                {t.name} ({t.difficulty})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function CoachStudentsPage() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [trainings, setTrainings] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [editingStudent, setEditingStudent] = useState(null); 

    // 1. Carregar Dados
    useEffect(() => {
        const fetchData = async () => {
            try {
                // A. Buscar Alunos
                const qStudents = query(collection(db, 'users'), where('role', '!=', 'admin'));
                const studentsSnap = await getDocs(qStudents);
                const studentsData = studentsSnap.docs.map(d => ({ uid: d.id, ...d.data() }));

                // B. Buscar Treinos
                const qTrainings = query(collection(db, 'trainings'), orderBy('name'));
                const trainingsSnap = await getDocs(qTrainings);
                const trainingsData = trainingsSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));

                // Cruzamento
                const enrichedStudents = studentsData.map(s => {
                    const currentTraining = trainingsData.find(t => t.firestoreId === s.currentTrainingId);
                    return { ...s, currentTrainingName: currentTraining?.name };
                });

                setStudents(enrichedStudents);
                setTrainings(trainingsData);

            } catch (error) {
                console.error("Erro fetch:", error);
                toast.error("Erro ao carregar dados");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // 2. Ação: Prescrever Treino
    const handleAssignTraining = async (studentId, training) => {
        const toastId = toast.loading("Salvando...");
        try {
            await updateDoc(doc(db, 'users', studentId), {
                currentTrainingId: training.firestoreId,
                currentTrainingName: training.name, 
                updatedAt: new Date().toISOString()
            });

            setStudents(prev => prev.map(s => 
                s.uid === studentId 
                ? { ...s, currentTrainingId: training.firestoreId, currentTrainingName: training.name } 
                : s
            ));

            setEditingStudent(null);
            toast.success(`Treino atribuído!`, { id: toastId });
        } catch (error) {
            console.error("Erro update:", error);
            // Mensagem de erro mais amigável se for permissão
            if (error.code === 'permission-denied') {
                toast.error("Sem permissão para editar aluno.", { id: toastId });
            } else {
                toast.error("Erro ao atribuir.", { id: toastId });
            }
        }
    };

    const handleOpenChat = (student) => {
        navigate('/coach/chat', { 
            state: { targetUser: { uid: student.uid, displayName: student.displayName, photoURL: student.photoURL } } 
        });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-8 pb-32 transition-colors duration-300">
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <button onClick={() => navigate('/coach/dashboard')} className="text-xs font-bold text-gray-500 hover:text-blue-500 mb-2">← Voltar ao Painel</button>
                        <h1 className="text-2xl font-black text-gray-800 dark:text-white">Meus Alunos</h1>
                        <p className="text-gray-500 text-sm">{students.length} alunos ativos</p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-blue-600/20 text-xs">
                        + Convidar
                    </button>
                </div>

                {/* Lista de Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map(student => (
                        <div key={student.uid} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col group hover:border-blue-300 transition-colors">
                            
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center text-lg font-bold text-gray-500">
                                    {student.photoURL ? (
                                        <img src={student.photoURL} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        student.displayName?.[0] || 'A'
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-white">{student.displayName || 'Sem Nome'}</h3>
                                    <p className="text-xs text-gray-400">{student.email}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl mb-4 border border-gray-100 dark:border-gray-700">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Ficha Atual</p>
                                <div className="flex justify-between items-center">
                                    <span className={`text-sm font-bold truncate max-w-[120px] ${student.currentTrainingName ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 italic'}`}>
                                        {student.currentTrainingName || 'Nenhum treino'}
                                    </span>
                                    <button 
                                        onClick={() => setEditingStudent(student)}
                                        className="text-[10px] bg-white dark:bg-gray-600 px-2 py-1 rounded border border-gray-200 dark:border-gray-500 hover:border-blue-400 transition-colors"
                                    >
                                        Alterar
                                    </button>
                                </div>
                            </div>

                            <div className="mt-auto grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => handleOpenChat(student)}
                                    className="flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                >
                                    <span>💬</span> Chat
                                </button>
                                <button className="flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-2 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors">
                                    <span>📊</span> Histórico
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {editingStudent && (
                <AssignWorkoutModal 
                    student={editingStudent}
                    trainings={trainings}
                    onClose={() => setEditingStudent(null)}
                    onAssign={handleAssignTraining}
                />
            )}
        </div>
    );
}