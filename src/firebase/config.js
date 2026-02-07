// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCb6DbkDHLrvMnyYFaNEKU8VsXrG3A7c80",
  authDomain: "workout-tracker-app-20e43.firebaseapp.com",
  projectId: "workout-tracker-app-20e43",
  storageBucket: "workout-tracker-app-20e43.firebasestorage.app",
  messagingSenderId: "701946803421",
  appId: "1:701946803421:web:faca2d5f6bcee4535f1734",
  measurementId: "G-FJX5V1ZML9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const authService = getAuth(app);

export { app, db, authService };
export const auth = getAuth(app);