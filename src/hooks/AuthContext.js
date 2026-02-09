import { createContext, useContext, useEffect, useState } from "react";
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile 
} from "firebase/auth";
import { auth, db } from "../firebase/config"; 
import { doc, setDoc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

// --- FUNÇÃO ÚTIL DE TRADUÇÃO (Vinda do arquivo antigo) ---
const translateError = (code) => {
    switch (code) {
        case 'auth/email-already-in-use': return 'Este email já está em uso.';
        case 'auth/invalid-email': return 'Email inválido.';
        case 'auth/weak-password': return 'A senha deve ter pelo menos 6 caracteres.';
        case 'auth/wrong-password': return 'Senha incorreta.';
        case 'auth/user-not-found': return 'Usuário não encontrado.';
        case 'auth/too-many-requests': return 'Muitas tentativas. Tente mais tarde.';
        case 'auth/invalid-credential': return 'Credenciais inválidas.';
        default: return 'Ocorreu um erro. Tente novamente.';
    }
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // Usuário do Auth (Login básico)
    const [userProfile, setUserProfile] = useState(null); // Dados do Firestore (Peso, Role, etc)
    const [authLoading, setAuthLoading] = useState(true);

    // --- 1. REGISTRO ---
    const register = async (email, password, displayName) => {
        try {
            const res = await createUserWithEmailAndPassword(auth, email, password);
            if (!res.user) throw new Error("Não foi possível criar o usuário.");

            await updateProfile(res.user, { displayName });

            // Inicializa com campos nulos para facilitar edição depois (Lógica do arquivo antigo)
            const initialData = {
                uid: res.user.uid,
                displayName,
                email,
                role: "user",
                createdAt: new Date().toISOString(),
                age: null,
                weight: null,
                height: null,
                photoURL: null
            };

            await setDoc(doc(db, "users", res.user.uid), initialData);

            setUser({ ...res.user, displayName }); 
            setUserProfile(initialData); // Já seta o perfil localmente
            return res.user;
        } catch (error) {
            console.error("Erro no register:", error);
            // Lança o erro traduzido para a tela exibir
            throw new Error(translateError(error.code));
        }
    };

    // --- 2. LOGIN ---
    const login = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // O useEffect lá embaixo vai carregar o userProfile automaticamente
        } catch (error) {
            throw new Error(translateError(error.code));
        }
    };

    // --- 3. LOGOUT ---
    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setUserProfile(null);
        } catch (error) {
            console.error("Erro ao sair:", error);
        }
    };

    // --- 4. MONITORAR STATUS + CARREGAR PERFIL (A Mágica) ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                
                // Busca dados extras do Firestore (Role, Peso, Altura...)
                try {
                    const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
                    if (docSnap.exists()) {
                        setUserProfile(docSnap.data());
                    }
                } catch (error) {
                    console.error("Erro ao buscar perfil:", error);
                }
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,           // Dados básicos (email, uid, photo)
        userProfile,    // Dados completos (role, peso, altura) do banco
        authLoading,
        register,
        login,
        logout,
        translateError // Exporta a função pra usar nas telas se quiser
    };

    return (
        <AuthContext.Provider value={value}>
            {!authLoading && children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext deve ser usado dentro de AuthProvider');
    }
    return context;
}