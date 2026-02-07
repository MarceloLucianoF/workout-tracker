import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../hooks/AuthContext';
import { useTheme } from '../../hooks/ThemeContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, logout } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    weight: '',
    height: '',
    age: '',
    goal: 'Hipertrofia'
  });

  // Carregar dados salvos
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      }
    };
    fetchUserData();
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        email: user.email,
        displayName: user.displayName,
        updatedAt: new Date()
      }, { merge: true }); // Merge evita apagar outros dados
      
      toast.success('Perfil atualizado!');
    } catch (error) {
      toast.error('Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  const calculateIMC = () => {
    if (!userData.weight || !userData.height) return null;
    const h = Number(userData.height) / 100; // cm para m
    const w = Number(userData.weight);
    return (w / (h * h)).toFixed(1);
  };

  const imc = calculateIMC();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      <div className="max-w-2xl mx-auto pb-24">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Meu Perfil 👤</h1>

        {/* Card Principal */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 mb-6 flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl">
            {user?.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{user?.displayName}</h2>
            <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
            <div className="flex gap-2 mt-3 justify-center md:justify-start">
               <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold uppercase">
                 {userData.goal}
               </span>
            </div>
          </div>
        </div>

        {/* Configurações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Card Tema */}
            <div 
                onClick={toggleTheme}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-500 transition-colors group"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase">Aparência</p>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mt-1">
                            {theme === 'dark' ? 'Modo Escuro 🌙' : 'Modo Claro ☀️'}
                        </h3>
                    </div>
                    <div className="w-10 h-6 bg-gray-200 dark:bg-gray-600 rounded-full relative group-hover:bg-blue-200 dark:group-hover:bg-blue-900 transition-colors">
                        <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 ${theme === 'dark' ? 'right-1 bg-blue-400' : 'left-1 bg-yellow-400'}`}></div>
                    </div>
                </div>
            </div>

            {/* Card IMC */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-sm font-bold text-gray-400 uppercase">Seu IMC</p>
                <div className="flex items-end gap-2 mt-1">
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{imc || '--'}</h3>
                    <span className="text-sm text-gray-500 mb-1">kg/m²</span>
                </div>
            </div>
        </div>

        {/* Formulário de Dados Físicos */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Dados Corporais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Peso (kg)</label>
                    <input 
                        type="number" 
                        value={userData.weight}
                        onChange={(e) => setUserData({...userData, weight: e.target.value})}
                        className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-bold"
                        placeholder="Ex: 75"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Altura (cm)</label>
                    <input 
                        type="number" 
                        value={userData.height}
                        onChange={(e) => setUserData({...userData, height: e.target.value})}
                        className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-bold"
                        placeholder="Ex: 175"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Idade</label>
                    <input 
                        type="number" 
                        value={userData.age}
                        onChange={(e) => setUserData({...userData, age: e.target.value})}
                        className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-bold"
                        placeholder="Ex: 25"
                    />
                </div>
            </div>
            
            <div className="mt-6">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Objetivo Atual</label>
                 <div className="flex gap-4">
                    {['Emagrecimento', 'Hipertrofia', 'Força'].map(opt => (
                        <button
                            key={opt}
                            onClick={() => setUserData({...userData, goal: opt})}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold border ${
                                userData.goal === opt 
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                                : 'bg-transparent text-gray-500 border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                 </div>
            </div>

            <button 
                onClick={handleSave}
                disabled={loading}
                className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-600/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
                {loading ? 'Salvando...' : 'Salvar Alterações 💾'}
            </button>
        </div>

        {/* Botão de Logout */}
        <button 
            onClick={logout}
            className="w-full bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-4 rounded-xl border border-red-100 dark:border-red-900/50 transition-colors flex items-center justify-center gap-2"
        >
            🚪 Sair da Conta
        </button>
        
        <p className="text-center text-xs text-gray-400 mt-6">
            AcademyUp v1.2 • Feito com 💪
        </p>

      </div>
    </div>
  );
}