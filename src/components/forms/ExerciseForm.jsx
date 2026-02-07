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
      [name]: ['sets', 'reps', 'rest', 'id'].includes(name) ? Number(value) : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.id || formData.id <= 0) newErrors.id = 'ID deve ser positivo';
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (formData.sets <= 0) newErrors.sets = '> 0';
    if (formData.reps <= 0) newErrors.reps = '> 0';
    if (formData.rest < 0) newErrors.rest = '>= 0';
    if (!formData.description.trim()) newErrors.description = 'Obrigatório';
    if (!formData.execution.trim()) newErrors.execution = 'Obrigatório';
    if (!formData.machineImage.trim()) newErrors.machineImage = 'URL obrigatória';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit(formData);
  };

  const muscleGroups = ['peito', 'costas', 'perna', 'ombro', 'braço', 'core'];
  const difficulties = ['iniciante', 'intermediário', 'avançado'];

  // Classes Reutilizáveis (Light + Dark Mode)
  const inputClasses = (hasError) => `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${hasError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`;
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4 transition-colors duration-300">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        {exercise ? 'Editar Exercício' : 'Novo Exercício'}
      </h2>

      {/* ID */}
      <div>
        <label className={labelClasses}>ID do Exercício *</label>
        <input
          type="number"
          name="id"
          value={formData.id}
          onChange={handleChange}
          className={inputClasses(errors.id)}
          placeholder="Ex: 1"
          disabled={!!exercise}
        />
        {errors.id && <p className="text-red-500 text-sm mt-1">{errors.id}</p>}
      </div>

      {/* Nome */}
      <div>
        <label className={labelClasses}>Nome do Exercício *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={inputClasses(errors.name)}
          placeholder="Ex: Supino Reto Máquina"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Grid: Séries, Reps, Rest */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClasses}>Séries *</label>
          <input type="number" name="sets" value={formData.sets} onChange={handleChange} className={inputClasses(errors.sets)} min="1" />
          {errors.sets && <p className="text-red-500 text-sm mt-1">{errors.sets}</p>}
        </div>
        <div>
          <label className={labelClasses}>Reps *</label>
          <input type="number" name="reps" value={formData.reps} onChange={handleChange} className={inputClasses(errors.reps)} min="1" />
          {errors.reps && <p className="text-red-500 text-sm mt-1">{errors.reps}</p>}
        </div>
        <div>
          <label className={labelClasses}>Descanso (s) *</label>
          <input type="number" name="rest" value={formData.rest} onChange={handleChange} className={inputClasses(errors.rest)} min="0" />
          {errors.rest && <p className="text-red-500 text-sm mt-1">{errors.rest}</p>}
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label className={labelClasses}>Descrição *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className={inputClasses(errors.description)}
          placeholder="Resumo do exercício..."
          rows="3"
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Execução */}
      <div>
        <label className={labelClasses}>Como Executar *</label>
        <textarea
          name="execution"
          value={formData.execution}
          onChange={handleChange}
          className={inputClasses(errors.execution)}
          placeholder="Passo a passo..."
          rows="4"
        />
        {errors.execution && <p className="text-red-500 text-sm mt-1">{errors.execution}</p>}
      </div>

      {/* URL da Imagem */}
      <div>
        <label className={labelClasses}>URL da Imagem *</label>
        <input
          type="url"
          name="machineImage"
          value={formData.machineImage}
          onChange={handleChange}
          className={inputClasses(errors.machineImage)}
          placeholder="https://..."
        />
        {errors.machineImage && <p className="text-red-500 text-sm mt-1">{errors.machineImage}</p>}
        
        {formData.machineImage && (
          <div className="mt-3">
            <img 
              src={formData.machineImage} 
              alt="Preview" 
              className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Erro+na+imagem'; }}
            />
          </div>
        )}
      </div>

      {/* URL do Vídeo */}
      <div>
        <label className={labelClasses}>URL do Vídeo (opcional)</label>
        <input
          type="url"
          name="videoUrl"
          value={formData.videoUrl}
          onChange={handleChange}
          className={inputClasses(false)}
          placeholder="https://youtube.com..."
        />
      </div>

      {/* Selects: Grupo e Dificuldade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Grupo Muscular *</label>
          <select name="muscleGroup" value={formData.muscleGroup} onChange={handleChange} className={inputClasses(false)}>
            {muscleGroups.map(group => (
              <option key={group} value={group}>{group.charAt(0).toUpperCase() + group.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClasses}>Dificuldade *</label>
          <select name="difficulty" value={formData.difficulty} onChange={handleChange} className={inputClasses(false)}>
            {difficulties.map(diff => (
              <option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Salvando...' : exercise ? 'Atualizar' : 'Criar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-400 dark:bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-500 dark:hover:bg-gray-500 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}