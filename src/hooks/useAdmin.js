import { useState, useEffect } from 'react';
import { useAuthContext } from './AuthContext';
import { db } from '../firebase/config';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  query,
  orderBy
} from 'firebase/firestore';

export function useAdmin() {
  const { user } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trainings, setTrainings] = useState([]); // Adicionado para suportar a página de Treinos

  // 1. VERIFICAÇÃO DE SEGURANÇA (O Crachá)
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        // Verifica se o campo 'role' é 'admin'
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Erro ao verificar admin:", err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // 2. FUNÇÃO AUXILIAR PARA BUSCAR TREINOS (Para a TrainingsPage)
  // Isso evita que a página de treinos quebre, pois ela usa 'const { trainings } = useAdmin()'
  useEffect(() => {
    const fetchTrainings = async () => {
        try {
            const q = query(collection(db, 'trainings'), orderBy('createdAt', 'desc')); // ou orderBy('name')
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
            setTrainings(data);
        } catch (err) {
            console.error("Erro ao buscar treinos no hook:", err);
            // Não seta erro global para não bloquear a UI se for só falha de rede temporária
        }
    };
    
    // Busca treinos independente de ser admin ou não (para exibir na galeria)
    fetchTrainings();
  }, []);


  return { 
    isAdmin, 
    loading, 
    trainings, // Exporta a lista de treinos
    error 
  };
}