// src/components/ImportExercises.jsx
import React, { useState } from 'react';

export default function ImportExercises({ onImport, onCancel, loading }) {
  const [, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(false);

  const validateExerciseData = (exercises) => {
    const validationErrors = [];
    const requiredFields = ['id', 'name', 'sets', 'reps', 'rest', 'description', 'execution', 'machineImage', 'muscleGroup', 'difficulty'];

    if (!Array.isArray(exercises)) {
      validationErrors.push('O arquivo deve conter um array de exercícios');
      return validationErrors;
    }

    exercises.forEach((exercise, index) => {
      // Verificar campos faltando
      const missingFields = requiredFields.filter(field => !(field in exercise));
      
      if (missingFields.length > 0) {
        validationErrors.push(`Exercício ${index + 1}: Campos faltando - ${missingFields.join(', ')}`);
        return;
      }

      // Validar tipos
      if (typeof exercise.id !== 'number' || exercise.id <= 0) {
        validationErrors.push(`Exercício ${index + 1}: ID deve ser um número positivo`);
      }

      if (typeof exercise.name !== 'string' || !exercise.name.trim()) {
        validationErrors.push(`Exercício ${index + 1}: Nome deve ser uma string não vazia`);
      }

      if (typeof exercise.sets !== 'number' || exercise.sets <= 0) {
        validationErrors.push(`Exercício ${index + 1}: Séries deve ser um número positivo`);
      }

      if (typeof exercise.reps !== 'number' || exercise.reps <= 0) {
        validationErrors.push(`Exercício ${index + 1}: Repetições deve ser um número positivo`);
      }

      if (typeof exercise.rest !== 'number' || exercise.rest < 0) {
        validationErrors.push(`Exercício ${index + 1}: Descanso deve ser um número não negativo`);
      }

      if (typeof exercise.description !== 'string' || !exercise.description.trim()) {
        validationErrors.push(`Exercício ${index + 1}: Descrição deve ser uma string não vazia`);
      }

      if (typeof exercise.execution !== 'string' || !exercise.execution.trim()) {
        validationErrors.push(`Exercício ${index + 1}: Execução deve ser uma string não vazia`);
      }

      if (typeof exercise.machineImage !== 'string' || !exercise.machineImage.trim()) {
        validationErrors.push(`Exercício ${index + 1}: machineImage deve ser uma URL válida`);
      }

      if (typeof exercise.muscleGroup !== 'string' || !exercise.muscleGroup.trim()) {
        validationErrors.push(`Exercício ${index + 1}: muscleGroup deve ser uma string não vazia`);
      }

      if (typeof exercise.difficulty !== 'string' || !exercise.difficulty.trim()) {
        validationErrors.push(`Exercício ${index + 1}: difficulty deve ser uma string não vazia`);
      }
    });

    return validationErrors;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.json')) {
      setErrors(['Por favor, selecione um arquivo JSON válido']);
      setFile(null);
      setPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target.result;
        
        // Limpar espaços em branco extras
        const cleanContent = fileContent.trim();
        
        const jsonData = JSON.parse(cleanContent);
        
        // Validar se é um array
        if (!Array.isArray(jsonData)) {
          setErrors(['O arquivo JSON deve conter um array de exercícios. Exemplo: [{ ... }, { ... }]']);
          setFile(null);
          setPreview(null);
          return;
        }

        if (jsonData.length === 0) {
          setErrors(['O array de exercícios está vazio']);
          setFile(null);
          setPreview(null);
          return;
        }

        // Validar dados
        const validationErrors = validateExerciseData(jsonData);
        
        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          setFile(null);
          setPreview(null);
          return;
        }

        // Se passou na validação
        setFile(selectedFile);
        setPreview(jsonData);
        setErrors([]);
        setSuccess(false);
      } catch (err) {
        console.error('Erro ao fazer parse:', err);
        setErrors([
          `Erro ao fazer parse do JSON: ${err.message}`,
          'Verifique se o arquivo está em formato JSON válido.',
          'Dica: Use um validador JSON online para verificar a sintaxe.'
        ]);
        setFile(null);
        setPreview(null);
      }
    };

    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!preview || preview.length === 0) {
      setErrors(['Nenhum exercício para importar']);
      return;
    }

    try {
      await onImport(preview);
      setSuccess(true);
      setFile(null);
      setPreview(null);
      setErrors([]);
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(false);
        onCancel();
      }, 3000);
    } catch (err) {
      setErrors(['Erro ao importar: ' + err.message]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Importar Exercícios</h2>

        {/* Mensagem de Sucesso */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            ✅ Exercícios importados com sucesso!
          </div>
        )}

        {/* Mensagens de Erro */}
        {errors.length > 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-semibold mb-2">Erros encontrados:</p>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload de Arquivo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecione arquivo JSON
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-2">
            O arquivo deve conter um array JSON com os exercícios
          </p>
        </div>

        {/* Preview dos Dados */}
        {preview && preview.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Preview: {preview.length} exercício(s) para importar
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="space-y-3">
                {preview.map((exercise, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-gray-200">
                    <p className="font-semibold text-gray-800">
                      {exercise.id} - {exercise.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {exercise.sets}x{exercise.reps} | {exercise.muscleGroup} | {exercise.difficulty}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Exemplo de JSON */}
        <div className="mb-6">
          <details className="bg-blue-50 p-4 rounded-lg">
            <summary className="cursor-pointer font-semibold text-blue-900">
              📋 Ver exemplo de formato JSON
            </summary>
            <pre className="mt-3 bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`[
  {
    "id": 1,
    "name": "Supino Reto Máquina",
    "sets": 4,
    "reps": 10,
    "rest": 90,
    "description": "Exercício para peito, ombro e tríceps",
    "execution": "Sente-se com as costas apoiadas. Pegue as alças e empurre para frente.",
    "machineImage": "https://via.placeholder.com/400x300?text=Supino",
    "videoUrl": "",
    "muscleGroup": "peito",
    "difficulty": "iniciante"
  },
  {
    "id": 2,
    "name": "Agachamento Livre",
    "sets": 4,
    "reps": 10,
    "rest": 90,
    "description": "Exercício fundamental para perna",
    "execution": "Pés na largura dos ombros. Desça como se fosse sentar.",
    "machineImage": "https://via.placeholder.com/400x300?text=Agachamento",
    "videoUrl": "",
    "muscleGroup": "perna",
    "difficulty": "intermediário"
  }
]`}
            </pre>
          </details>
        </div>

        {/* Botões */}
        <div className="flex gap-4">
          <button
            onClick={handleImport}
            disabled={!preview || preview.length === 0 || loading}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Importando...' : `Importar ${preview?.length || 0} Exercício(s)`}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-400 text-white py-2 rounded-lg font-semibold hover:bg-gray-500"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}