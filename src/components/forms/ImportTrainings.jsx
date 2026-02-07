import React, { useState } from 'react';

export default function ImportTrainings({ onImport, onCancel, loading, exercises }) {
  const [, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(false);

  const validateTrainingData = (trainings) => {
    const validationErrors = [];
    trainings.forEach((training, index) => {
        if (!training.id || !training.name || !training.exercises) {
            validationErrors.push(`Item ${index+1}: Faltam dados obrigatórios.`);
        }
    });
    return validationErrors;
  };

  const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
      if (!selectedFile) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target.result);
              if(Array.isArray(json)) {
                  const valErrors = validateTrainingData(json);
                  if (valErrors.length > 0) {
                      setErrors(valErrors);
                  } else {
                      setFile(selectedFile);
                      setPreview(json);
                      setErrors([]);
                  }
              } else {
                 setErrors(['Arquivo inválido (não é array).']);
              }
          } catch(err) { setErrors(['Erro no JSON.']); }
      };
      reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!preview) return;
    try {
      await onImport(preview);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onCancel(); }, 2000);
    } catch (err) {
      setErrors([err.message]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors duration-300">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Importar Treinos</h2>

        {success && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-6">
            ✅ Importado com sucesso!
          </div>
        )}

        {errors.length > 0 && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
             <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => <li key={index} className="text-sm">{error}</li>)}
            </ul>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selecione JSON</label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {preview && preview.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Preview: {preview.length} treinos</h3>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                {preview.map((item, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                    <p className="font-semibold text-gray-800 dark:text-white">{item.id} - {item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.exercises?.length || 0} exercícios | {item.difficulty}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleImport}
            disabled={!preview || loading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50 transition"
          >
            {loading ? 'Importando...' : 'Confirmar Importação'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-400 dark:bg-gray-600 hover:bg-gray-500 dark:hover:bg-gray-500 text-white py-2 rounded-lg font-semibold transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}