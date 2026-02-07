// src/hooks/useCheckIns.js
import { useState } from 'react';
import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

export function useCheckIns(userId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addCheckIn = async (checkInData) => {
    try {
      setLoading(true);
      setError(null);

      const checkInsRef = collection(db, 'users', userId, 'checkIns');
      
      const docRef = await addDoc(checkInsRef, {
        ...checkInData,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      });

      return docRef.id;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getCheckIns = async (trainingDay = null) => {
    try {
      setLoading(true);
      setError(null);

      let q;
      if (trainingDay) {
        q = query(
          collection(db, 'users', userId, 'checkIns'),
          where('trainingDay', '==', trainingDay)
        );
      } else {
        q = collection(db, 'users', userId, 'checkIns');
      }

      const snapshot = await getDocs(q);
      const checkIns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return checkIns;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addCheckIn, getCheckIns, loading, error };
}