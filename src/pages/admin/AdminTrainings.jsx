import React, { useState } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import TrainingForm from '../../components/forms/TrainingForm';
import ImportTrainings from '../../components/forms/ImportTrainings';
import toast from 'react-hot-toast';

export default function AdminTrainings() {
  const { exercises, trainings, loading, error, addTraining, updateTraining, deleteTraining, importTrainings } = useAdmin();
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddTraining = async (formData) => {
    const loadingToast = toast.loading('Salvando treino...');
    try {
      await addTraining(formData);
      setShowForm(false);
      toast.success('Treino adicionado com sucesso!', { id: loadingToast });
    } catch (err) {
      toast.error('Erro ao adicionar: ' + err.message, { id: loadingToast });
    }
  };

  const handleUpdateTraining = async (formData) => {
    const loadingToast = toast.loading('Atualizando treino...');
    try {
      await updateTraining(editingTraining.firestoreId, formData);
      setEditingTraining(null);
      toast.success('Treino atualizado com sucesso!', { id: loadingToast });
    } catch (err) {
      toast.error('Erro ao atualizar: ' + err.message, { id: loadingToast });
    }
  };

  const handleDeleteTraining = async (training) => {
    if (window.confirm(`Tem certeza que deseja deletar "${training.name}"?`)) {
      const loadingToast = toast.loading('Deletando...');
      try {
        await deleteTraining(training.firestoreId);
        toast.success('Treino deletado!', { id: loadingToast });
      } catch (err) {
        toast.error('Erro ao deletar: ' + err.message, { id: loadingToast });
      }
    }
  };

  const handleImportTrainings = async (trainingsArray) => {
    const loadingToast = toast.loading('Importando...');
    try {
      const count = await importTrainings(trainingsArray);
      toast.success(`${count} treinos importados!`, { id: loadingToast });
      setShowImportModal(false);
    } catch (err) {
      toast.error('Erro na importação: ' + err.message, { id: loadingToast });
    }
  };

  // --- CORREÇÃO AQUI ---
  // Usamos (tr.name || '') para garantir que nunca seja undefined
  const filteredTrainings = (trainings || []).filter(tr => {
    const name = (tr.name || '').toLowerCase();
    const description = (tr.description || '').toLowerCase();
    const term = (searchTerm || '').toLowerCase();
    
    return name.includes(term) || description.includes(term);
  });

  if (showForm || editingTraining) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
          <TrainingForm
            training={editingTraining}
            exercises={exercises}
            onSubmit={editingTraining ? handleUpdateTraining : handleAddTraining}
            onCancel={() => {
              setShowForm(false);
              setEditingTraining(null);
            }}
            loading={loading}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Gerenciar Treinos</h1>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex-1 md:flex-none bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              📥 Importar JSON
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex-1 md:flex-none bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              + Novo Treino
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Barra de Busca */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 transition-colors"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">Carregando treinos...</p>
          </div>
        ) : filteredTrainings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">Nenhum treino encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTrainings.map(training => {
              // --- SEGURANÇA AQUI TAMBÉM ---
              const exerciseList = Array.isArray(training.exercises) ? training.exercises : [];
              
              return (
                <div key={training.firestoreId} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 border border-transparent dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{training.name || 'Sem Nome'}</h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{training.description || 'Sem descrição'}</p>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <p>📋 {exerciseList.length} exercício(s)</p>
                    <p className={`inline-block px-2 py-1 rounded text-xs font-semibold
                      ${training.difficulty === 'iniciante' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        training.difficulty === 'intermediário' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                      {training.difficulty || 'N/A'}
                    </p>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded mb-4">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">IDs dos Exercícios:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono truncate">
                      {exerciseList.length > 0 ? exerciseList.join(', ') : 'Nenhum exercício'}
                    </p>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingTraining(training)}
                      className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteTraining(training)}
                      className="flex-1 bg-red-600 text-white py-2 rounded font-semibold hover:bg-red-700 transition"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Importação */}
      {showImportModal && (
        <ImportTrainings
          onImport={handleImportTrainings}
          onCancel={() => setShowImportModal(false)}
          loading={loading}
          exercises={exercises}
        />
      )}
    </div>
  );
}