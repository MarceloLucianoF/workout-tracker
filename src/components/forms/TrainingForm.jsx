import React, { useState, useEffect } from 'react';

// Recebemos 'training' diretamente agora, alinhado com o AdminTrainings
export default function TrainingForm({ training, exercises = [], onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    difficulty: 'iniciante',
    exercises: [], // Array de IDs
  });
  
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Identifica se é edição baseado na existência do objeto 'training'
  const isEdit = !!training;

  useEffect(() => {
    if (training) {
      // MODO EDIÇÃO: Preenche com os dados recebidos
      setFormData({
        id: training.id || '',
        name: training.name || '',
        description: training.description || '',
        difficulty: training.difficulty || 'iniciante',
        exercises: training.exercises || [],
      });
    } else {
      // MODO ADIÇÃO: Reseta o formulário
      setFormData({ 
        id: '', 
        name: '', 
        description: '', 
        difficulty: 'iniciante', 
        exercises: [] 
      });
    }
  }, [training]); // Dependência correta: roda apenas quando o treino muda

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleToggleExercise = (exId) => {
    setFormData(prev => {
      const current = prev.exercises || [];
      const updated = current.includes(exId)
        ? current.filter(id => id !== exId)
        : [...current, exId];
      return { ...prev, exercises: updated };
    });
    setErrors(prev => ({ ...prev, exercises: '' }));
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.id) tempErrors.id = "ID é obrigatório.";
    if (!formData.name) tempErrors.name = "Nome é obrigatório.";
    if (!formData.description) tempErrors.description = "Descrição é obrigatória.";
    if (formData.exercises.length === 0) tempErrors.exercises = "Selecione pelo menos um exercício.";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ ...formData, id: Number(formData.id) });
    }
  };

  // Filtragem
  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Classes (Light + Dark)
  const inputClasses = (hasError) => `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${hasError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`;
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        {isEdit ? `Editar Treino: ${training.name}` : 'Adicionar Novo Treino'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ID e Nome */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>ID Numérico</label>
            <input
              type="number"
              name="id"
              value={formData.id}
              onChange={handleChange}
              className={inputClasses(errors.id)}
              disabled={isEdit} // Desabilita edição de ID se for modo edição
              placeholder="Ex: 1"
            />
            {errors.id && <p className="text-red-500 text-xs mt-1">{errors.id}</p>}
          </div>
          <div>
            <label className={labelClasses}>Nome do Treino</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={inputClasses(errors.name)}
              placeholder="Ex: Treino A"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className={labelClasses}>Descrição</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={inputClasses(errors.description)}
            placeholder="Objetivo do treino..."
            rows="2"
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>

        {/* Dificuldade */}
        <div>
          <label className={labelClasses}>Dificuldade</label>
          <select name="difficulty" value={formData.difficulty} onChange={handleChange} className={inputClasses(false)}>
            <option value="iniciante">Iniciante</option>
            <option value="intermediário">Intermediário</option>
            <option value="avançado">Avançado</option>
          </select>
        </div>

        {/* Seleção de Exercícios (Customizada) */}
        <div>
          <label className={labelClasses}>Exercícios ({formData.exercises.length} selecionados)</label>
          
          <input 
            type="text"
            placeholder="Filtrar lista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`mb-2 text-sm ${inputClasses(false)}`}
          />

          <div className="h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900/50 p-2">
             {filteredExercises.length === 0 ? (
                <p className="text-gray-500 text-center p-4">Nenhum exercício encontrado.</p>
             ) : (
                filteredExercises.map(ex => (
                   <div 
                      key={ex.id} 
                      onClick={() => handleToggleExercise(ex.id)}
                      className={`flex items-center p-2 rounded cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0
                        ${formData.exercises.includes(ex.id) 
                           ? 'bg-blue-100 dark:bg-blue-900/40' 
                           : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`
                      }
                   >
                      <input 
                        type="checkbox" 
                        checked={formData.exercises.includes(ex.id)} 
                        readOnly 
                        className="mr-3 h-4 w-4 text-blue-600 rounded"
                      />
                      <div>
                         <p className="text-sm font-medium text-gray-800 dark:text-white">{ex.name}</p>
                         <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{ex.muscleGroup}</p>
                      </div>
                   </div>
                ))
             )}
          </div>
          {errors.exercises && <p className="text-red-500 text-xs mt-1">{errors.exercises}</p>}
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition"
          >
            {loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Adicionar')}
          </button>
        </div>
      </form>
    </div>
  );
}