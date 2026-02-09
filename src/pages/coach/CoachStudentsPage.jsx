import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuthContext } from '../../hooks/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function StudentsPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [trainings, setTrainings] = useState([]); // Para o modal de seleção
  const [loading, setLoading] = useState(true);
  
  // Controle do Modal de Atribuição
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // 1. Buscar Dados (Alunos e Treinos do Coach)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // A. Buscar Alunos
        const qStudents = query(collection(db, 'users'), where('coachId', '==', user.uid));
        const studentsSnap = await getDocs(qStudents);
        const studentsList = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // B. Buscar Treinos (Para saber o nome do treino atual e preencher o modal)
        const qTrainings = query(
            collection(db, 'trainings'), 
            where('coachId', '==', user.uid),
            orderBy('name')
        );
        const trainingsSnap = await getDocs(qTrainings);
        const trainingsList = trainingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        setStudents(studentsList);
        setTrainings(trainingsList);
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // 2. Helper para achar nome do treino pelo ID
  const getTrainingName = (id) => {
      if (!id) return null;
      const training = trainings.find(t => t.id === id);
      return training ? training.name : 'Treino (Apagado)';
  };

  // 3. Função de Atribuir Treino
  const handleAssignTraining = async (trainingId) => {
      if (!selectedStudent) return;
      
      const loadingToast = toast.loading("Atualizando aluno...");
      try {
          // Atualiza o perfil do aluno com o ID do treino
          await updateDoc(doc(db, 'users', selectedStudent.id), {
              currentTrainingId: trainingId
          });

          // Atualiza lista localmente para refletir a mudança sem reload
          setStudents(prev => prev.map(s => 
              s.id === selectedStudent.id ? { ...s, currentTrainingId: trainingId } : s
          ));

          toast.success("Treino atribuído!", { id: loadingToast });
          setShowModal(false);
      } catch (error) {
          console.error(error);
          toast.error("Erro ao atribuir.", { id: loadingToast });
      }
  };

  // 4. Ir para Chat
  const handleChat = (student) => {
      navigate('/coach/chat', { 
          state: { 
              targetUser: { 
                  uid: student.id, 
                  displayName: student.displayName, 
                  photoURL: student.photoURL 
              } 
          } 
      });
  };

  if (loading) return <div className="h-screen flex items-center justify-center dark:bg-gray-900"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-8 pb-32">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <button onClick={() => navigate('/coach/dashboard')} className="text-gray-500 hover:text-blue-500 text-sm font-bold mb-2">← Voltar</button>
                <h1 className="text-3xl font-black text-gray-800 dark:text-white">Carteira de Alunos 👥</h1>
                <p className="text-gray-500 text-sm">Gerencie o acesso e os treinos dos seus {students.length} alunos.</p>
            </div>
            
            {/* Atalho para convidar se a lista estiver vazia ou coach quiser mais */}
            <button 
                onClick={() => navigate('/coach/dashboard')} // Volta pro dash para pegar o código
                className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl font-bold shadow-sm text-sm hover:bg-gray-50 transition-colors"
            >
                📢 Código de Convite
            </button>
        </div>

        {/* Lista de Alunos */}
        {students.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <span className="text-4xl block mb-2 opacity-50">🦗</span>
                <p className="text-gray-500">Nenhum aluno vinculado ainda.</p>
                <p className="text-sm text-gray-400 mt-1">Envie seu código de convite para começar.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {students.map(student => {
                    const currentTrainingName = getTrainingName(student.currentTrainingId);
                    
                    return (
                        <div key={student.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-blue-200 transition-colors">
                            
                            {/* Info do Aluno */}
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                                    {student.photoURL ? <img src={student.photoURL} className="w-full h-full object-cover rounded-full" alt=""/> : student.displayName?.[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">{student.displayName}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span>{student.email}</span>
                                        {/* Status simples (Poderia ser mais complexo com lastSeen) */}
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    </div>
                                </div>
                            </div>

                            {/* Status do Treino */}
                            <div className="flex-1 w-full md:text-center bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Treino Atual</p>
                                {currentTrainingName ? (
                                    <p className="font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
                                        <span>📋</span> {currentTrainingName}
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">Nenhum treino atribuído</p>
                                )}
                            </div>

                            {/* Ações */}
                            <div className="flex gap-2 w-full md:w-auto">
                                <button 
                                    onClick={() => handleChat(student)}
                                    className="flex-1 md:flex-none px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 transition-colors rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                                >
                                    💬 Chat
                                </button>
                                <button 
                                    onClick={() => { setSelectedStudent(student); setShowModal(true); }}
                                    className="flex-1 md:flex-none px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 transition-opacity rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2"
                                >
                                    🏋️ Trocar Treino
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* MODAL DE ATRIBUIÇÃO */}
        {showModal && selectedStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[80vh]">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-black text-gray-800 dark:text-white">Definir Treino</h3>
                            <p className="text-sm text-gray-500">Para: <span className="font-bold text-blue-600">{selectedStudent.displayName}</span></p>
                        </div>
                        <button onClick={() => setShowModal(false)} className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full hover:bg-gray-200 transition-colors">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 p-1">
                        {trainings.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <p>Você não criou nenhum treino ainda.</p>
                                <button onClick={() => navigate('/admin/trainings')} className="text-blue-500 font-bold mt-2">Criar Ficha agora</button>
                            </div>
                        ) : (
                            trainings.map(t => (
                                <button 
                                    key={t.id}
                                    onClick={() => handleAssignTraining(t.id)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center group ${
                                        selectedStudent.currentTrainingId === t.id 
                                        ? 'bg-green-50 border-green-500 ring-1 ring-green-500 dark:bg-green-900/20' 
                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:shadow-md'
                                    }`}
                                >
                                    <div>
                                        <h4 className="font-bold text-gray-800 dark:text-white">{t.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded text-gray-500 dark:text-gray-300 uppercase">{t.difficulty}</span>
                                            <span className="text-xs text-gray-400">{t.exercises?.length || 0} exercícios</span>
                                        </div>
                                    </div>
                                    {selectedStudent.currentTrainingId === t.id && (
                                        <span className="text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded">ATUAL</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}