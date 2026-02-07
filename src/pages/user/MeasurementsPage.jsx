import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../hooks/AuthContext';
import { collection, query, where, orderBy, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

export default function MeasurementsPage() {
  const { user } = useAuthContext();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    bodyFat: '',
    chest: '',
    arms: '',
    waist: '',
    thighs: '',
    calves: ''
  });

  // Carregar Histórico
  useEffect(() => {
    const fetchMeasurements = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'measurements'),
          where('userId', '==', user.uid),
          orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
        setLogs(data);
      } catch (error) {
        console.error("Erro ao buscar medidas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMeasurements();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Salvando medidas...');
    
    try {
      // 1. Salva no histórico de medidas
      const newLog = {
        userId: user.uid,
        ...formData,
        timestamp: new Date()
      };
      const docRef = await addDoc(collection(db, 'measurements'), newLog);
      
      // 2. Atualiza o Peso Atual no Perfil do Usuário (Para aparecer na Home)
      if (formData.weight) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { weight: formData.weight });
      }

      // Atualiza lista local
      setLogs(prev => [{ firestoreId: docRef.id, ...newLog }, ...prev]);
      setShowForm(false);
      toast.success('Medidas registradas! 📉', { id: loadingToast });
      
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar.', { id: loadingToast });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apagar este registro?')) {
      try {
        await deleteDoc(doc(db, 'measurements', id));
        setLogs(prev => prev.filter(item => item.firestoreId !== id));
        toast.success('Registro apagado.');
      } catch (error) {
        toast.error('Erro ao apagar.');
      }
    }
  };

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300 pb-24">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Evolução Corporal 📏</h1>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-transform active:scale-95"
          >
            {showForm ? 'Cancelar' : '+ Nova Medição'}
          </button>
        </div>

        {/* Formulário de Adição */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-8 animate-fade-in">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="col-span-2 md:col-span-4">
                    <label className="text-xs font-bold text-gray-500 uppercase">Data</label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-2 rounded bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600" />
                </div>
                
                {/* Campos de Medidas */}
                {[
                  { label: 'Peso (kg)', key: 'weight', icon: '⚖️' },
                  { label: '% Gordura', key: 'bodyFat', icon: '💧' },
                  { label: 'Peitoral (cm)', key: 'chest', icon: '👕' },
                  { label: 'Braços (cm)', key: 'arms', icon: '💪' },
                  { label: 'Cintura (cm)', key: 'waist', icon: '👖' },
                  { label: 'Coxas (cm)', key: 'thighs', icon: '🍗' },
                  { label: 'Panturrilha (cm)', key: 'calves', icon: '🦵' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                      {field.icon} {field.label}
                    </label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={formData[field.key]} 
                      onChange={e => setFormData({...formData, [field.key]: e.target.value})} 
                      className="w-full p-2 rounded bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                ))}
              </div>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors">
                Salvar Registro 💾
              </button>
            </form>
          </div>
        )}

        {/* Lista de Histórico */}
        {loading ? (
           <div className="text-center py-10"><div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>
        ) : logs.length === 0 ? (
           <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
             <p className="text-gray-500">Nenhum registro ainda. Tire suas medidas hoje!</p>
           </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.firestoreId} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4 relative group hover:border-blue-300 transition-colors">
                
                {/* Data e Peso (Destaque) */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                   <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 p-3 rounded-lg text-center min-w-[80px]">
                      <span className="block text-xs font-bold uppercase">{new Date(log.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="block text-2xl font-bold leading-none">{new Date(log.date).getDate()}</span>
                   </div>
                   <div>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {log.weight ? `${log.weight}kg` : '--'}
                      </h3>
                      {log.bodyFat && <p className="text-xs text-gray-500">{log.bodyFat}% Gordura</p>}
                   </div>
                </div>

                {/* Grid de Medidas Secundárias */}
                <div className="grid grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-300 w-full md:w-auto">
                    {log.chest && <div><span className="text-xs text-gray-400 block">Peito</span>{log.chest}cm</div>}
                    {log.arms && <div><span className="text-xs text-gray-400 block">Braço</span>{log.arms}cm</div>}
                    {log.waist && <div><span className="text-xs text-gray-400 block">Cintura</span>{log.waist}cm</div>}
                    {log.thighs && <div><span className="text-xs text-gray-400 block">Coxa</span>{log.thighs}cm</div>}
                    {log.calves && <div><span className="text-xs text-gray-400 block">Pantu</span>{log.calves}cm</div>}
                </div>

                <button 
                  onClick={() => handleDelete(log.firestoreId)}
                  className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}