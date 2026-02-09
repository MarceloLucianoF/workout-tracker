import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../hooks/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    displayName: '',
    goal: 'Hipertrofia',
    height: '',
    weight: '',
    age: '',
    photoURL: ''
  });

  // Carrega dados do Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            displayName: data.displayName || user.displayName || '',
            goal: data.goal || 'Hipertrofia',
            height: data.height || '',
            weight: data.weight || '',
            age: data.age || '',
            photoURL: data.photoURL || ''
          });
        }
      } catch (error) {
        console.error("Erro perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const saveToast = toast.loading('Salvando perfil...');
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      toast.success('Perfil atualizado!', { id: saveToast });
    } catch (error) {
      toast.error('Erro ao salvar.', { id: saveToast });
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Deseja realmente sair?")) {
      await logout();
      navigate('/login');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors duration-300 pb-24">
      <div className="max-w-2xl mx-auto">
        
        {/* Header com Botão Voltar */}
        <div className="flex justify-between items-center mb-8">
            <button onClick={() => navigate('/home')} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-bold flex items-center gap-2">
                ← Voltar
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Meu Perfil</h1>
            <div className="w-8"></div> {/* Espaço vazio para centralizar título visualmente */}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            
            {/* Capa / Avatar */}
            <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 relative">
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                    <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 p-1 shadow-xl">
                        <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-4xl overflow-hidden">
                            {formData.photoURL ? (
                                <img src={formData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span>{formData.displayName?.charAt(0).toUpperCase() || '👤'}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-16 pb-8 px-8">
                <form onSubmit={handleSave} className="space-y-6">
                    
                    {/* Dados Pessoais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Nome de Exibição</label>
                            <input 
                                type="text" 
                                name="displayName"
                                value={formData.displayName} 
                                onChange={handleChange}
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Meta Principal</label>
                            <select 
                                name="goal"
                                value={formData.goal} 
                                onChange={handleChange}
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            >
                                <option value="Hipertrofia">💪 Hipertrofia</option>
                                <option value="Emagrecimento">🔥 Emagrecimento</option>
                                <option value="Força">🏋️ Força Pura</option>
                                <option value="Resistência">🏃 Resistência</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Link da Foto (Opcional)</label>
                            <input 
                                type="url" 
                                name="photoURL"
                                placeholder="https://..."
                                value={formData.photoURL} 
                                onChange={handleChange}
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 my-6"></div>

                    {/* Medidas Corporais */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Medidas Atuais</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Peso (kg)</label>
                                <input 
                                    type="number" 
                                    name="weight"
                                    value={formData.weight} 
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Altura (cm)</label>
                                <input 
                                    type="number" 
                                    name="height"
                                    value={formData.height} 
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Idade</label>
                                <input 
                                    type="number" 
                                    name="age"
                                    value={formData.age} 
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-4">
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-transform active:scale-95">
                            Salvar Alterações 💾
                        </button>
                        
                        <button type="button" onClick={handleLogout} className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold py-4 rounded-xl hover:bg-red-100 transition-colors">
                            Sair da Conta 🚪
                        </button>
                    </div>

                </form>
            </div>
        </div>

        {/* Rodapé Informativo */}
        <div className="text-center mt-8 text-gray-400 text-xs">
            <p>AcademyUp v1.0.0 (MVP)</p>
            <p className="mt-1">ID: {user.uid.slice(0, 8)}...</p>
        </div>

      </div>
    </div>
  );
}