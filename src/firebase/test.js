// src/firebase/test.js
import { db, authService } from './config';
import { collection, getDocs } from 'firebase/firestore';

export async function testFirebaseConnection() {
  try {
    console.log('🔄 Testando conexão com Firebase...');
    
    // Testar Firestore
    const exercisesRef = collection(db, 'exercises');
    const snapshot = await getDocs(exercisesRef);
    
    console.log('✅ Firestore conectado!');
    console.log(`📊 Exercícios encontrados: ${snapshot.size}`);
    
    // Testar Auth
    console.log('✅ Auth conectado!');
    console.log(`👤 Usuário atual: ${authService.currentUser?.email || 'Nenhum'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
    return false;
  }
}