// src/pages/admin/AdminExercises.jsx
import React, { useState } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import ExerciseForm from '../../components/forms/ExerciseForm';
import ImportExercises from '../../components/forms/ImportExercises';

export default function AdminExercises() {
  const { exercises, loading, error, addExercise, updateExercise, deleteExercise, importExercises } = useAdmin();
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddExercise = async (formData) => {
    try {
      await addExercise(formData);
      setShowForm(false);
      alert('Exercício adicionado com sucesso!');
    } catch (err) {
      alert('Erro ao adicionar exercício: ' + err.message);
    }
  };

  const handleUpdateExercise = async (formData) => {
    try {
      await updateExercise(editingExercise.firestoreId, formData);
      setEditingExercise(null);
      alert('Exercício atualizado com sucesso!');
    } catch (err) {
      alert('Erro ao atualizar exercício: ' + err.message);
    }
  };

  const handleDeleteExercise = async (exercise) => {
    if (window.confirm(`Tem certeza que deseja deletar "${exercise.name}"?`)) {
      try {
        await deleteExercise(exercise.firestoreId);
        alert('Exercício deletado com sucesso!');
      } catch (err) {
        alert('Erro ao deletar exercício: ' + err.message);
      }
    }
  };

  const handleImportExercises = async (exercisesArray) => {
    try {
      const count = await importExercises(exercisesArray);
      alert(`${count} exercício(s) importado(s) com sucesso!`);
      setShowImportModal(false);
    } catch (err) {
      alert('Erro ao importar: ' + err.message);
    }
  };

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showForm || editingExercise) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <ExerciseForm
            exercise={editingExercise}
            onSubmit={editingExercise ? handleUpdateExercise : handleAddExercise}
            onCancel={() => {
              setShowForm(false);
              setEditingExercise(null);
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
          <h1 className="text-4xl font-bold text-gray-800">Gerenciar Exercícios</h1>
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
              + Novo Exercício
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
            placeholder="Buscar por nome ou grupo muscular..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Carregando exercícios...</p>
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Nenhum exercício encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExercises.map(exercise => (
              <div key={exercise.firestoreId} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                {/* Imagem */}
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img
                    src={exercise.machineImage}
                    alt={exercise.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300?text=Sem+imagem';
                    }}
                  />
                </div>

                {/* Conteúdo */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{exercise.name}</h3>
                  
                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    <p>📊 {exercise.sets}x{exercise.reps}</p>
                    <p>⏱️ {exercise.rest}s descanso</p>
                    <p>💪 {exercise.muscleGroup}</p>
                    <p>📈 {exercise.difficulty}</p>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {exercise.description}
                  </p>

                  {/* Botões */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedExercise(exercise)}
                      className="flex-1 bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 text-sm"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => setEditingExercise(exercise)}
                      className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteExercise(exercise)}
                      className="flex-1 bg-red-600 text-white py-2 rounded font-semibold hover:bg-red-700 text-sm"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{selectedExercise.name}</h2>
              <button
                onClick={() => setSelectedExercise(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <img 
                src={selectedExercise.machineImage} 
                alt={selectedExercise.name}
                className="w-full h-64 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x300?text=Sem+imagem';
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Séries</p>
                  <p className="text-lg text-gray-800">{selectedExercise.sets}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Repetições</p>
                  <p className="text-lg text-gray-800">{selectedExercise.reps}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Descanso</p>
                  <p className="text-lg text-gray-800">{selectedExercise.rest}s</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Grupo Muscular</p>
                  <p className="text-lg text-gray-800">{selectedExercise.muscleGroup}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Descrição</p>
                <p className="text-gray-700">{selectedExercise.description}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Como Executar</p>
                <p className="text-gray-700">{selectedExercise.execution}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Dificuldade</p>
                <p className="text-lg text-gray-800">{selectedExercise.difficulty}</p>
              </div>

              {selectedExercise.videoUrl && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Vídeo</p>
                  <a 
                    href={selectedExercise.videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Assistir vídeo
                  </a>
                </div>
              )}

              <button
                onClick={() => setSelectedExercise(null)}
                className="w-full bg-gray-400 text-white py-2 rounded-lg font-semibold hover:bg-gray-500 mt-6"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação */}
      {showImportModal && (
        <ImportExercises
          onImport={handleImportExercises}
          onCancel={() => setShowImportModal(false)}
          loading={loading}
        />
      )}
    </div>
  );
}