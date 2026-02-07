// src/hooks/useTrainings.js
import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export function useTrainings() {
  const [trainings, setTrainings] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar treinos
        const trainingsSnapshot = await getDocs(collection(db, 'trainings'));
        const trainingsData = trainingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTrainings(trainingsData);

        // Buscar exercícios
        const exercisesSnapshot = await getDocs(collection(db, 'exercises'));
        const exercisesData = exercisesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setExercises(exercisesData);

        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { trainings, exercises, loading, error };
}