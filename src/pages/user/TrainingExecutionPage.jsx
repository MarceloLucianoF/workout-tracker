// src/pages/user/TrainingExecutionPage.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../hooks/AuthContext';
import { useAdmin } from '../../hooks/useAdmin';
import { db } from '../../firebase/config';
import { addDoc, collection } from 'firebase/firestore';

export default function TrainingExecutionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { exercises } = useAdmin();
  
  const training = location.state?.training;
  const [completedExercises, setCompletedExercises] = useState({});
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [trainingStarted, setTrainingStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);

  if (!training) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Treino não encontrado</p>
      </div>
    );
  }

  const trainingExercises = exercises.filter(ex => 
    training.exercises.includes(ex.id)
  );

  const currentExercise = trainingExercises[currentExerciseIndex];
  const totalExercises = trainingExercises.length;
  const completedCount = Object.values(completedExercises).filter(Boolean).length;
  const progress = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  const handleStartTraining = () => {
    setTrainingStarted(true);
    setStartTime(new Date());
  };

  const toggleExercise = (exerciseId) => {
    setCompletedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const handleFinishTraining = async () => {
    setSaving(true);
    try {
      const completedExerciseIds = trainingExercises
        .filter(ex => completedExercises[ex.id])
        .map(ex => ex.id);

      await addDoc(collection(db, 'checkIns'), {
        userId: user.uid,
        trainingId: training.firestoreId,
        trainingName: training.name,
        completedExercises: completedExerciseIds,
        totalExercises: totalExercises,
        date: new Date().toISOString(),
        timestamp: new Date(),
        duration: startTime ? Math.round((new Date() - startTime) / 60000) : 0
      });

      alert('Treino finalizado com sucesso!');
      navigate('/history');
    } catch (err) {
      alert('Erro ao finalizar treino: ' + err.message);
      console.error('Erro ao salvar check-in:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!trainingStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/trainings')}
            className="mb-6 bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
          >
            ← Voltar
          </button>

          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">{training.name}</h1>
            
            <p className="text-gray-600 text-lg mb-6">{training.description}</p>

            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <p className="text-gray-700 mb-4">
                <span className="text-3xl font-bold text-blue-600">{totalExercises}</span>
                <span className="text-gray-600"> exercícios</span>
              </p>
              <p className="text-gray-600 mb-2">Dificuldade: <span className="font-semibold">{training.difficulty}</span></p>
              <p className="text-gray-600">Tempo estimado: <span className="font-semibold">~45-60 minutos</span></p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleStartTraining}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition transform hover:scale-105"
              >
                🏋️ Iniciar Treino
              </button>
              <button
                onClick={() => navigate('/trainings')}
                className="w-full bg-gray-400 text-white py-3 rounded-lg font-semibold hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{training.name}</h1>
          <button
            onClick={() => navigate('/trainings')}
            className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
          >
            ← Voltar
          </button>
        </div>

        {/* Barra de Progresso */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <p className="text-gray-700 font-semibold">Progresso Geral</p>
            <p className="text-2xl font-bold text-green-600">{completedCount}/{totalExercises}</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-gray-600 text-sm mt-2">{progress}% completo</p>
        </div>

        {/* Exercício Atual */}
        {currentExercise && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            {/* Número do Exercício */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500 font-semibold">EXERCÍCIO {currentExerciseIndex + 1} DE {totalExercises}</p>
                <h2 className="text-3xl font-bold text-gray-800 mt-2">{currentExercise.name}</h2>
              </div>
              <div className="text-right">
                <input
                  type="checkbox"
                  checked={completedExercises[currentExercise.id] || false}
                  onChange={() => toggleExercise(currentExercise.id)}
                  className="w-8 h-8 cursor-pointer accent-green-600"
                />
                <p className="text-sm text-gray-600 mt-2">Marcar como completo</p>
              </div>
            </div>

            {/* Imagem */}
            <div className="mb-6">
              <img
                src={currentExercise.machineImage}
                alt={currentExercise.name}
                className="w-full h-64 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600x400?text=Sem+imagem';
                }}
              />
            </div>

            {/* Informações do Exercício */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-semibold">Séries</p>
                <p className="text-3xl font-bold text-blue-600">{currentExercise.sets}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-semibold">Repetições</p>
                <p className="text-3xl font-bold text-purple-600">{currentExercise.reps}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-semibold">Descanso</p>
                <p className="text-3xl font-bold text-orange-600">{currentExercise.rest}s</p>
              </div>
              <div className="bg-pink-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-semibold">Grupo</p>
                <p className="text-lg font-bold text-pink-600 capitalize">{currentExercise.muscleGroup}</p>
              </div>
            </div>

            {/* Descrição e Execução */}
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">📋 Descrição</p>
                <p className="text-gray-600">{currentExercise.description}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">🎯 Como Executar</p>
                <p className="text-gray-600">{currentExercise.execution}</p>
              </div>
            </div>

            {/* Botões de Navegação */}
            <div className="flex gap-3">
              <button
                onClick={handlePreviousExercise}
                disabled={currentExerciseIndex === 0}
                className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-semibold hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <button
                onClick={handleNextExercise}
                disabled={currentExerciseIndex === totalExercises - 1}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo →
              </button>
            </div>
          </div>
        )}

        {/* Botão de Finalizar */}
        <div className="flex gap-3">
          <button
            onClick={handleFinishTraining}
            disabled={saving || completedCount === 0}
            className="flex-1 bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? '⏳ Salvando...' : `✅ Finalizar Treino (${completedCount}/${totalExercises})`}
          </button>
          <button
            onClick={() => navigate('/trainings')}
            className="flex-1 bg-gray-400 text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-500"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}