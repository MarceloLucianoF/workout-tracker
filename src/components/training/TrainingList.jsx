// src/components/TrainingList.jsx
// Este componente não é usado diretamente no App.jsx, mas é um exemplo de como seria
// se você quisesse separar a lógica de listagem da página principal de treinos.
import React from 'react';

function TrainingList({ trainings, onSelectTraining }) {
  return (
    <div className="training-list-container">
      {trainings.map(training => (
        <div
          key={training.id}
          className="training-card"
          onClick={() => onSelectTraining(training.id)}
        >
          <h2 className="training-card-title">{training.name}</h2>
          <p className="training-card-info">📅 {training.day}</p>
          <p className="training-card-info">⏱️ {training.duration}</p>
          <p className="training-card-info">💪 {training.exercises.length} exercícios</p>
          <button className="btn btn-primary btn-small">Ver Treino →</button>
        </div>
      ))}
    </div>
  );
}

export default TrainingList;