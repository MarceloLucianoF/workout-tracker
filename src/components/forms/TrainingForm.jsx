// src/components/TrainingForm.jsx
import React, { useState, useEffect } from 'react';

export default function TrainingForm({ onSubmit, onCancel, initialData = {}, mode = 'add', loading, allExercises = [] }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    day: '',
    duration: '',
    difficulty: '',
    exercises: [], // Array de IDs de exercícios
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        id: initialData.id || '',
        name: initialData.name || '',
        day: initialData.day || '',
        duration: initialData.duration || '',
        difficulty: initialData.difficulty || '',
        exercises: initialData.exercises || [],
      });
    } else {
      // Resetar formulário para modo 'add'
      setFormData({
        id: '', name: '', day: '', duration: '', difficulty: '', exercises: [],
      });
    }
  }, [initialData, mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleExerciseSelection = (e) => {
    const options = Array.from(e.target.selectedOptions, option => Number(option.value));
    setFormData(prev => ({ ...prev, exercises: options }));
    setErrors(prev => ({ ...prev, exercises: '' }));
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.id) tempErrors.id = "ID é obrigatório.";
    if (!formData.name) tempErrors.name = "Nome é obrigatório.";
    if (!formData.day) tempErrors.day = "Dia é obrigatório.";
    if (!formData.duration) tempErrors.duration = "Duração é obrigatória.";
    if (!formData.difficulty) tempErrors.difficulty = "Dificuldade é obrigatória.";
    if (formData.exercises.length === 0) tempErrors.exercises = "Selecione pelo menos um exercício.";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      await onSubmit(formData);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        {mode === 'add' ? 'Adicionar Novo Treino' : `Editar Treino: ${initialData.name}`}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="id" className="block text-sm font-medium text-gray-700">ID</label>
            <input
              type="text"
              id="id"
              name="id"
              value={formData.id}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.id ? 'border-red-500' : ''}`}
              disabled={mode === 'edit'} // ID não editável
            />
            {errors.id && <p className="text-red-500 text-xs mt-1">{errors.id}</p>}
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Treino</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="day" className="block text-sm font-medium text-gray-700">Dia</label>
            <input
              type="text"
              id="day"
              name="day"
              value={formData.day}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.day ? 'border-red-500' : ''}`}
            />
            {errors.day && <p className="text-red-500 text-xs mt-1">{errors.day}</p>}
          </div>
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duração</label>
            <input
              type="text"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.duration ? 'border-red-500' : ''}`}
            />
            {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
          </div>
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">Dificuldade</label>
            <select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.difficulty ? 'border-red-500' : ''}`}
            >
              <option value="">Selecione</option>
              <option value="iniciante">Iniciante</option>
              <option value="intermediario">Intermediario</option>
              <option value="avancado">Avançado</option>
            </select>
            {errors.difficulty && <p className="text-red-500 text-xs mt-1">{errors.difficulty}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="exercises" className="block text-sm font-medium text-gray-700">Exercícios</label>
          <select
            multiple
            id="exercises"
            name="exercises"
            value={formData.exercises.map(String)} // Converte para string para o select
            onChange={handleExerciseSelection}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-48 ${errors.exercises ? 'border-red-500' : ''}`}
          >
            {allExercises.map(ex => (
              <option key={ex.firestoreId} value={ex.id}>
                {ex.id} - {ex.name} ({ex.muscleGroup})
              </option>
            ))}
          </select>
          {errors.exercises && <p className="text-red-500 text-xs mt-1">{errors.exercises}</p>}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : (mode === 'add' ? 'Adicionar Treino' : 'Atualizar Treino')}
          </button>
        </div>
      </form>
    </div>
  );
}