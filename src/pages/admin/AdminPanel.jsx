// src/pages/admin/AdminPanel.jsx
import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import AdminExercises from './AdminExercises';
import AdminTrainings from './AdminTrainings';

export default function AdminPanel() {
  const location = useLocation();

  const isExercisesActive = location.pathname.includes('/admin/exercises');
  const isTrainingsActive = location.pathname.includes('/admin/trainings');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="flex">
        <div className="w-64 bg-gray-800 text-white p-6 min-h-screen">
          <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
          
          <nav className="space-y-4">
            <Link
              to="/admin/exercises"
              className={`block px-4 py-2 rounded-lg transition ${
                isExercisesActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              📋 Exercícios
            </Link>
            <Link
              to="/admin/trainings"
              className={`block px-4 py-2 rounded-lg transition ${
                isTrainingsActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              🏋️ Treinos
            </Link>
          </nav>
        </div>

        {/* Conteúdo */}
        <div className="flex-1">
          <Routes>
            <Route path="/exercises" element={<AdminExercises />} />
            <Route path="/trainings" element={<AdminTrainings />} />
            <Route path="/" element={<AdminExercises />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}