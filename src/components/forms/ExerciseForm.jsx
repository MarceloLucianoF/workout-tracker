// src/components/ExerciseForm.jsx
import React, { useState, useEffect } from 'react';

export default function ExerciseForm({ exercise, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    sets: 4,
    reps: 10,
    rest: 90,
    description: '',
    execution: '',
    machineImage: 'https://via.placeholder.com/400x300?text=Exercicio',
    videoUrl: '',
    muscleGroup: 'peito',
    difficulty: 'iniciante'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (exercise) {
      setFormData(exercise);
    }
  }, [exercise]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sets' || name === 'reps' || name === 'rest' || name === 'id' 
        ? Number(value) 
        : value
    }));
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.id || formData.id <= 0) {
      newErrors.id = 'ID deve ser um número positivo';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    if (formData.sets <= 0) {
      newErrors.sets = 'Séries deve ser maior que 0';
    }
    if (formData.reps <= 0) {
      newErrors.reps = 'Repetições deve ser maior que 0';
    }
    if (formData.rest < 0) {
      newErrors.rest = 'Descanso não pode ser negativo';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }
    if (!formData.execution.trim()) {
      newErrors.execution = 'Execução é obrigatória';
    }
    if (!formData.machineImage.trim()) {
      newErrors.machineImage = 'URL da imagem é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const muscleGroups = ['peito', 'costas', 'perna', 'ombro', 'braço', 'core'];
  const difficulties = ['iniciante', 'intermediário', 'avançado'];

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {exercise ? 'Editar Exercício' : 'Novo Exercício'}
      </h2>

      {/* ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ID do Exercício *
        </label>
        <input
          type="number"
          name="id"
          value={formData.id}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.id ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Ex: 1"
          disabled={exercise ? true : false}
        />
        {errors.id && <p className="text-red-500 text-sm mt-1">{errors.id}</p>}
      </div>

      {/* Nome */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Exercício *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Ex: Supino Reto Máquina"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Séries, Repetições, Descanso */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Séries *
          </label>
          <input
            type="number"
            name="sets"
            value={formData.sets}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.sets ? 'border-red-500' : 'border-gray-300'
            }`}
            min="1"
          />
          {errors.sets && <p className="text-red-500 text-sm mt-1">{errors.sets}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Repetições *
          </label>
          <input
            type="number"
            name="reps"
            value={formData.reps}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.reps ? 'border-red-500' : 'border-gray-300'
            }`}
            min="1"
          />
          {errors.reps && <p className="text-red-500 text-sm mt-1">{errors.reps}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descanso (s) *
          </label>
          <input
            type="number"
            name="rest"
            value={formData.rest}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.rest ? 'border-red-500' : 'border-gray-300'
            }`}
            min="0"
          />
          {errors.rest && <p className="text-red-500 text-sm mt-1">{errors.rest}</p>}
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Ex: Exercício para peito, ombro e tríceps"
          rows="3"
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Execução */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Como Executar *
        </label>
        <textarea
          name="execution"
          value={formData.execution}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.execution ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Ex: Sente-se com as costas apoiadas..."
          rows="4"
        />
        {errors.execution && <p className="text-red-500 text-sm mt-1">{errors.execution}</p>}
      </div>

      {/* URL da Imagem */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL da Imagem da Máquina *
        </label>
        <input
          type="url"
          name="machineImage"
          value={formData.machineImage}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.machineImage ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Ex: https://via.placeholder.com/400x300?text=Supino"
        />
        {errors.machineImage && <p className="text-red-500 text-sm mt-1">{errors.machineImage}</p>}
        
        {/* Preview da imagem */}
        {formData.machineImage && (
          <div className="mt-3">
            <img 
              src={formData.machineImage} 
              alt="Preview" 
              className="w-full h-48 object-cover rounded-lg"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x300?text=Erro+na+imagem';
              }}
            />
          </div>
        )}
      </div>

      {/* URL do Vídeo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL do Vídeo (opcional)
        </label>
        <input
          type="url"
          name="videoUrl"
          value={formData.videoUrl}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ex: https://www.youtube.com/watch?v=..."
        />
      </div>

      {/* Grupo Muscular */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Grupo Muscular *
        </label>
        <select
          name="muscleGroup"
          value={formData.muscleGroup}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {muscleGroups.map(group => (
            <option key={group} value={group}>
              {group.charAt(0).toUpperCase() + group.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Dificuldade */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dificuldade *
        </label>
        <select
          name="difficulty"
          value={formData.difficulty}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {difficulties.map(diff => (
            <option key={diff} value={diff}>
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Botões */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : exercise ? 'Atualizar' : 'Criar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-400 text-white py-2 rounded-lg font-semibold hover:bg-gray-500"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}