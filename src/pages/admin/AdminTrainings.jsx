// src/pages/admin/AdminTrainings.jsx
import React, { useState } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import TrainingForm from '../../components/forms/TrainingForm';
import ImportTrainings from '../../components/forms/ImportTrainings';

export default function AdminTrainings() {
  const { exercises, trainings, loading, error, addTraining, updateTraining, deleteTraining, importTrainings } = useAdmin();
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddTraining = async (formData) => {
    try {
      await addTraining(formData);
      setShowForm(false);
      alert('Treino adicionado com sucesso!');
    } catch (err) {
      alert('Erro ao adicionar treino: ' + err.message);
    }
  };

  const handleUpdateTraining = async (formData) => {
    try {
      await updateTraining(editingTraining.firestoreId, formData);
      setEditingTraining(null);
      alert('Treino atualizado com sucesso!');
    } catch (err) {
      alert('Erro ao atualizar treino: ' + err.message);
    }
  };

  const handleDeleteTraining = async (training) => {
    if (window.confirm(`Tem certeza que deseja deletar "${training.name}"?`)) {
      try {
        await deleteTraining(training.firestoreId);
        alert('Treino deletado com sucesso!');
      } catch (err) {
        alert('Erro ao deletar treino: ' + err.message);
      }
    }
  };

  const handleImportTrainings = async (trainingsArray) => {
    try {
      const count = await importTrainings(trainingsArray);
      alert(`${count} treino(s) importado(s) com sucesso!`);
      setShowImportModal(false);
    } catch (err) {
      alert('Erro ao importar: ' + err.message);
    }
  };

  const filteredTrainings = trainings.filter(tr =>
    tr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tr.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showForm || editingTraining) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Gerenciar Treinos</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700"
            >
              📥 Importar JSON
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
            >
              + Novo Treino
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Carregando treinos...</p>
          </div>
        ) : filteredTrainings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Nenhum treino encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTrainings.map(training => {
              const exerciseList = Array.isArray(training.exercises) ? training.exercises : [];
              
              return (
                <div key={training.firestoreId} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{training.name}</h3>
                  
                  <p className="text-gray-600 mb-4">{training.description}</p>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>📋 {exerciseList.length} exercício(s)</p>
                    <p>📈 {training.difficulty}</p>
                  </div>

                  <div className="bg-gray-100 p-3 rounded mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Exercícios:</p>
                    <p className="text-sm text-gray-600">
                      {exerciseList.length > 0 ? exerciseList.join(', ') : 'Nenhum exercício'}
                    </p>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingTraining(training)}
                      className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteTraining(training)}
                      className="flex-1 bg-red-600 text-white py-2 rounded font-semibold hover:bg-red-700 text-sm"
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