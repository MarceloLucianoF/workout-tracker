import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../hooks/AuthContext'; 
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';
import { useSearchParams, useNavigate } from 'react-router-dom'; // Novos imports

export default function Profile() {
  const { user, userData, updateLocalUserData } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Verifica se veio do cadastro (Onboarding)
  const isNewUser = searchParams.get('new') === 'true';

  const [formData, setFormData] = useState({
    displayName: '',
    age: '',
    weight: '',
    height: '',
  });

  useEffect(() => {
    // Carrega dados. Se for novo, userData pode estar vazio, então pega do Auth (user)
    if (user) {
      setFormData(prev => ({
        ...prev,
        displayName: userData?.displayName || user.displayName || '',
        age: userData?.age || '',
        weight: userData?.weight || '',
        height: userData?.height || '',
      }));
    }
  }, [userData, user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        displayName: formData.displayName,
        age: Number(formData.age),
        weight: Number(formData.weight),
        height: Number(formData.height),
        updatedAt: new Date(),
      };

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, dataToSave, { merge: true });
      updateLocalUserData(dataToSave);
      
      toast.success(isNewUser ? 'Perfil criado! Vamos treinar! 🚀' : 'Perfil atualizado com sucesso!', {
        duration: 3000,
        style: { background: '#10B981', color: '#fff' },
      });

      // Se for novo usuário, redireciona para Home após salvar
      if (isNewUser) {
        navigate('/home');
      }

    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar perfil.', {
        style: { background: '#EF4444', color: '#fff' },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      
      {/* Mensagem especial para novos usuários */}
      {isNewUser ? (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 p-6 rounded-xl border border-blue-100 dark:border-blue-800 animate-fade-in-down">
          <h1 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-2">
            Olá, {user?.displayName || 'Atleta'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Bem-vindo ao Workout Tracker. Preencha seus dados para personalizarmos sua experiência, ou pule para começar logo.
          </p>
        </div>
      ) : (
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Meu Perfil</h1>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300">
        
        <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold uppercase">
                {user?.displayName?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div className="ml-4">
                <p className="font-semibold text-lg text-gray-900 dark:text-white">
                  {formData.displayName || user?.email}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">UID: {user?.uid?.slice(0,5)}...</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Nome Editável */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome de Exibição</label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              placeholder="Seu nome"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Idade</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="Anos"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Peso (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                step="0.1"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="Kg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Altura (m)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                step="0.01"
                placeholder="Ex: 1.60"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none disabled:bg-blue-300 transition-colors"
            >
              {loading ? 'Salvando...' : (isNewUser ? 'Salvar e Começar' : 'Salvar Alterações')}
            </button>

            {/* Botão Pular (Só aparece se for novo usuário) */}
            {isNewUser && (
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Pular
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}