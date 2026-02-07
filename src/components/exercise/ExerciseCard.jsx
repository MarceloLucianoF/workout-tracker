// src/components/ExerciseCard.jsx
import React, { useState } from 'react';
import ExerciseExecution from './ExerciseExecution'; // Detalhes de execução
import CheckInForm from './CheckInForm'; // Formulário de check-in

function ExerciseCard({ exercise, isCompleted, onCheckIn, exerciseNumber }) {
  const [showExecutionDetails, setShowExecutionDetails] = useState(false); // Estado para mostrar detalhes de execução
  const [showCheckInForm, setShowCheckInForm] = useState(false); // Estado para mostrar formulário de check-in

  const handleCheckInSubmit = (data) => {
    onCheckIn(exercise.id, data); // Chama a função de check-in do pai
    setShowCheckInForm(false); // Esconde o formulário após o envio
  };

  return (
    <div className={`exercise-card ${isCompleted ? 'completed' : ''}`}>
      <div className="exercise-card-header">
        <h3 className="exercise-card-title">
          {exerciseNumber}. {exercise.name} {isCompleted && <span className="check-mark">✅</span>}
        </h3>
        <span className="exercise-card-muscle-group">Grupo Muscular: {exercise.muscleGroup}</span>
      </div>

      <div className="exercise-card-info-row">
        <span className="exercise-card-detail">📊 {exercise.sets} séries</span>
        <span className="exercise-card-detail">🔁 {exercise.reps} repetições</span>
        <span className="exercise-card-detail">⏱️ {exercise.rest}s descanso</span>
      </div>

      <div className="exercise-card-actions">
        <button
          onClick={() => setShowExecutionDetails(!showExecutionDetails)}
          className="btn btn-secondary btn-small"
        >
          {showExecutionDetails ? '▲ Fechar Detalhes' : '▼ Ver Execução'}
        </button>

        {!isCompleted && (
          <button
            onClick={() => setShowCheckInForm(!showCheckInForm)}
            className="btn btn-primary btn-small"
          >
            {showCheckInForm ? 'Cancelar Check-in' : '✓ Marcar Completo'}
          </button>
        )}
      </div>

      {showExecutionDetails && <ExerciseExecution exercise={exercise} />}
      {showCheckInForm && (
        <CheckInForm
          exercise={exercise}
          onSubmit={handleCheckInSubmit}
          onCancel={() => setShowCheckInForm(false)}
        />
      )}
    </div>
  );
}

export default ExerciseCard;