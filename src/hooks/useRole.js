import { useState, useEffect } from 'react';
import { useAuthContext } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useRole = () => {
    const { user } = useAuthContext();
    const [role, setRole] = useState(null); // 'user', 'admin', 'coach'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            if (user) {
                try {
                    const docRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(docRef);
                    
                    if (docSnap.exists()) {
                        // Pega o campo 'role' do banco. Se não existir, assume 'user'
                        setRole(docSnap.data().role || 'user');
                    } else {
                        setRole('user');
                    }
                } catch (error) {
                    console.error("Erro ao buscar role:", error);
                    setRole('user'); // Fallback seguro
                }
            } else {
                setRole(null);
            }
            setLoading(false);
        };

        fetchRole();
    }, [user]);

    return { 
        role, 
        // Helpers booleanos para facilitar os IFs
        isAdmin: role === 'admin',
        isCoach: role === 'coach' || role === 'admin', // Admin tb é coach
        loading 
    };
};