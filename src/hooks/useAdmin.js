// src/hooks/useAdmin.js
import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase/config';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  orderBy
} from 'firebase/firestore';

export function useAdmin() {
  const [exercises, setExercises] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Funções de Exercícios ---

  const getExercises = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'exercises'), orderBy('id', 'asc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        firestoreId: doc.id,
        ...doc.data()
      }));
      setExercises(data);
    } catch (err) {
      setError(err.message);
      console.error("Erro ao buscar exercícios:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addExercise = async (exerciseData) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = await addDoc(collection(db, 'exercises'), {
        ...exerciseData,
        createdAt: new Date().toISOString()
      });
      setExercises(prev => [...prev, { firestoreId: docRef.id, ...exerciseData }]);
      return docRef.id;
    } catch (err) {
      setError(err.message);
      console.error("Erro ao adicionar exercício:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateExercise = async (firestoreId, exerciseData) => {
    setLoading(true);
    setError(null);
    try {
      const exerciseRef = doc(db, 'exercises', firestoreId);
      await updateDoc(exerciseRef, {
        ...exerciseData,
        updatedAt: new Date().toISOString()
      });
      setExercises(prev => prev.map(ex => 
        ex.firestoreId === firestoreId ? { ...ex, ...exerciseData } : ex
      ));
    } catch (err) {
      setError(err.message);
      console.error("Erro ao atualizar exercício:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteExercise = async (firestoreId) => {
    setLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, 'exercises', firestoreId));
      setExercises(prev => prev.filter(ex => ex.firestoreId !== firestoreId));
    } catch (err) {
      setError(err.message);
      console.error("Erro ao deletar exercício:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const importExercises = async (exercisesArray) => {
    setLoading(true);
    setError(null);
    try {
      const addedExercises = [];
      
      for (const exerciseData of exercisesArray) {
        const docRef = await addDoc(collection(db, 'exercises'), {
          ...exerciseData,
          createdAt: new Date().toISOString()
        });
        addedExercises.push({ firestoreId: docRef.id, ...exerciseData });
      }
      
      setExercises(prev => [...prev, ...addedExercises]);
      return addedExercises.length;
    } catch (err) {
      setError(err.message);
      console.error("Erro ao importar exercícios:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // --- Funções de Treinos ---

  const getTrainings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'trainings'), orderBy('id', 'asc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        firestoreId: doc.id,
        ...doc.data()
      }));
      setTrainings(data);
    } catch (err) {
      setError(err.message);
      console.error("Erro ao buscar treinos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTraining = async (trainingData) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = await addDoc(collection(db, 'trainings'), {
        ...trainingData,
        createdAt: new Date().toISOString()
      });
      setTrainings(prev => [...prev, { firestoreId: docRef.id, ...trainingData }]);
      return docRef.id;
    } catch (err) {
      setError(err.message);
      console.error("Erro ao adicionar treino:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTraining = async (firestoreId, trainingData) => {
    setLoading(true);
    setError(null);
    try {
      const trainingRef = doc(db, 'trainings', firestoreId);
      await updateDoc(trainingRef, {
        ...trainingData,
        updatedAt: new Date().toISOString()
      });
      setTrainings(prev => prev.map(tr => 
        tr.firestoreId === firestoreId ? { ...tr, ...trainingData } : tr
      ));
    } catch (err) {
      setError(err.message);
      console.error("Erro ao atualizar treino:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTraining = async (firestoreId) => {
    setLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, 'trainings', firestoreId));
      setTrainings(prev => prev.filter(tr => tr.firestoreId !== firestoreId));
    } catch (err) {
      setError(err.message);
      console.error("Erro ao deletar treino:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const importTrainings = async (trainingsArray) => {
    setLoading(true);
    setError(null);
    try {
      const addedTrainings = [];
      
      for (const trainingData of trainingsArray) {
        const docRef = await addDoc(collection(db, 'trainings'), {
          ...trainingData,
          createdAt: new Date().toISOString()
        });
        addedTrainings.push({ firestoreId: docRef.id, ...trainingData });
      }
      
      setTrainings(prev => [...prev, ...addedTrainings]);
      return addedTrainings.length;
    } catch (err) {
      setError(err.message);
      console.error("Erro ao importar treinos:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Carrega dados iniciais ao montar o hook
  useEffect(() => {
    getExercises();
    getTrainings();
  }, [getExercises, getTrainings]);

  return {
    exercises,
    trainings,
    loading,
    error,
    getExercises,
    addExercise,
    updateExercise,
    deleteExercise,
    importExercises,
    getTrainings,
    addTraining,
    updateTraining,
    deleteTraining,
    importTrainings
  };
}