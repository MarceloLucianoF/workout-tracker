import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../hooks/AuthContext'; 
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function Profile() {
  const { user, userData, updateLocalUserData } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    displayName: user?.email || '',
    age: '',
    weight: '',
    height: '',
  });

  useEffect(() => {
    if (userData) {
      setFormData(prev => ({
        ...prev,
        age: userData.age || '',
        weight: userData.weight || '',
        height: userData.height || '',
      }));
    }
  }, [userData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const dataToSave = {
        age: Number(formData.age),
        weight: Number(formData.weight),
        height: Number(formData.height),
        updatedAt: new Date(),
      };

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, dataToSave, { merge: true });
      updateLocalUserData(dataToSave);
      setMessage('✅ Perfil atualizado com sucesso!');
    } catch (error) {
      console.error(error);
      setMessage('❌ Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Meu Perfil</h1>

      {/* Container Principal: Branco no claro, Cinza Escuro no escuro */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300">
        
        <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold uppercase">
                {user?.email?.[0] || 'U'}
            </div>
            <div className="ml-4">
                <p className="font-semibold text-lg text-gray-900 dark:text-white">{user?.email}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">UID: {user?.uid?.slice(0,5)}...</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Campo Idade */}
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
            
            {/* Campo Peso */}
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
            
            {/* Campo Altura */}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none disabled:bg-blue-300 transition-colors"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>

          {message && (
            <div className={`mt-4 p-2 text-center rounded ${message.includes('Erro') ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}