import { useEffect, useState } from 'react';
import { auth, db } from '../firebase/config'; // Ajustado para 'auth' se seu config exporta como auth, ou mantenha authService
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile // <--- Importante: Para atualizar o nome no Auth
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // <--- Adicionado setDoc

export function useAuth() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      
      if (currentUser) {
        setUser(currentUser);
        
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setUserData({});
          }
        } catch (err) {
          console.error("Erro ao buscar dados do perfil:", err);
        }

      } else {
        setUser(null);
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ATUALIZADO: Recebe displayName
  const signup = async (email, password, displayName) => {
    try {
      setError(null);
      setLoading(true);
      
      // 1. Cria a conta no Auth
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Atualiza o "Nome de Exibição" no Auth
      await updateProfile(result.user, { displayName });

      // 3. Cria o documento no Firestore imediatamente
      await setDoc(doc(db, 'users', result.user.uid), {
        displayName,
        email,
        createdAt: new Date(),
        age: null,
        weight: null,
        height: null,
      });

      return result.user;
    } catch (err) {
      console.error(err); // Log para debug
      setError(firebaseErrorTranslate(err.code)); // Traduz o erro
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      setError(firebaseErrorTranslate(err.code));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      setLoading(true);
      await signOut(auth);
      setUser(null);
      setUserData(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateLocalUserData = (newData) => {
    setUserData((prev) => ({ ...prev, ...newData }));
  };

  return { 
    user, 
    userData, 
    loading, 
    error, 
    signup, 
    login, 
    logout,
    updateLocalUserData 
  };
}

// Função auxiliar de tradução de erros
const firebaseErrorTranslate = (code) => {
  switch (code) {
    case 'auth/email-already-in-use': return 'Este email já está em uso.';
    case 'auth/invalid-email': return 'Email inválido.';
    case 'auth/weak-password': return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/wrong-password': return 'Senha incorreta.';
    case 'auth/user-not-found': return 'Usuário não encontrado.';
    default: return 'Ocorreu um erro. Tente novamente.';
  }
};