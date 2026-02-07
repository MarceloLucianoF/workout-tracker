import { useEffect, useState } from 'react';
// IMPORTANTE: Adicionei 'db' na importação. Certifique-se que ele é exportado no config.js
import { authService, db } from '../firebase/config'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
// Novos imports do Firestore
import { doc, getDoc } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); // NOVO: Estado para dados do perfil
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authService, async (currentUser) => {
      setLoading(true);
      
      if (currentUser) {
        setUser(currentUser);
        
        // --- Lógica Nova: Buscar dados do Perfil no Firestore ---
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setUserData({}); // Se não tiver perfil criado ainda
          }
        } catch (err) {
          console.error("Erro ao buscar dados do perfil:", err);
          // Não travamos o app, apenas logamos o erro
        }
        // -------------------------------------------------------

      } else {
        setUser(null);
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const result = await createUserWithEmailAndPassword(authService, email, password);
      // O onAuthStateChanged vai lidar com o state do user
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const result = await signInWithEmailAndPassword(authService, email, password);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      setLoading(true);
      await signOut(authService);
      setUser(null);
      setUserData(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para atualizar o estado localmente sem reload
  const updateLocalUserData = (newData) => {
    setUserData((prev) => ({ ...prev, ...newData }));
  };

  return { 
    user, 
    userData, // Exportando dados do perfil
    loading, 
    error, 
    signup, 
    login, 
    logout,
    updateLocalUserData // Exportando função de atualização
  };
}