// src/components/ExerciseExecution.jsx
import React from 'react';

function ExerciseExecution({ exercise }) {
  return (
    <div className="exercise-execution-details">
      <h4 className="execution-details-title">Instruções de Execução:</h4>
      
      {exercise.machineImage && (
        <div className="machine-image-container">
          <img src={exercise.machineImage} alt={`Máquina para ${exercise.name}`} className="machine-image" />
          <p className="image-caption">Máquina: {exercise.name}</p>
        </div>
      )}

      <p className="execution-description">{exercise.execution}</p>

      <h4 className="execution-details-subtitle">Dicas Importantes:</h4>
      <ul className="execution-tips-list">
        <li>Mantenha a postura correta durante todo o movimento.</li>
        <li>Controle a fase excêntrica (descida) do movimento.</li>
        <li>Respeite o tempo de descanso para otimizar a recuperação.</li>
        <li>Concentre-se na contração do músculo alvo.</li>
        <li>Ajuste a carga para que as últimas repetições sejam desafiadoras.</li>
      </ul>

      {exercise.videoUrl && (
        <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-video">
          🎥 Ver Vídeo de Execução
        </a>
      )}
    </div>
  );
}

export default ExerciseExecution;