import { useState, useEffect } from 'react';
import { 
    collection, query, where, orderBy, onSnapshot, 
    addDoc, setDoc, updateDoc, doc, serverTimestamp, getDoc 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

export const useChat = (user) => {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Carregar Chats (Para o Coach ver a lista ordenada)
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'chats'), 
            where('participants', 'array-contains', user.uid),
            orderBy('updatedAt', 'desc') // ✅ Ordenação correta
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setChats(chatList);
            setLoading(false);
        }, (error) => {
            console.error("Erro chat list:", error);
            // Ignora erro de permissão inicial (cache)
            if (error.code !== 'permission-denied') setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // 2. Carregar Mensagens (Do chat ativo)
    useEffect(() => {
        if (!activeChat) {
            setMessages([]);
            return;
        }

        const q = query(
            collection(db, 'chats', activeChat.id, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [activeChat]);

    // 3. Enviar Mensagem (Atualizando o Pai)
    const sendMessage = async (text) => {
        if (!activeChat || !text.trim()) return;

        try {
            // A. Salva mensagem na subcoleção
            await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
                text,
                senderId: user.uid,
                createdAt: serverTimestamp(),
                senderName: user.displayName || 'Usuário'
            });

            // B. Atualiza o chat pai (Para ordenar a lista e mostrar preview)
            await updateDoc(doc(db, 'chats', activeChat.id), {
                lastMessage: text,
                updatedAt: serverTimestamp() // ✅ Faz o chat subir para o topo
            });

        } catch (error) {
            console.error("Erro ao enviar:", error);
            toast.error("Não foi possível enviar.");
        }
    };

    // 4. Abrir Chat (ID Determinístico para evitar duplicidade)
    const openChatWithUser = async (targetUser) => {
        if (!user || !targetUser) return;

        // Gera ID único combinando UIDs em ordem alfabética (A_B é igual a B_A)
        const sortedIds = [user.uid, targetUser.uid].sort();
        const deterministicId = `${sortedIds[0]}_${sortedIds[1]}`;

        try {
            // Tenta buscar o chat direto pelo ID
            const chatDocRef = doc(db, 'chats', deterministicId);
            const chatSnap = await getDoc(chatDocRef);

            if (!chatSnap.exists()) {
                // Cria se não existe (usando setDoc com ID fixo)
                const newChatData = {
                    participants: [user.uid, targetUser.uid],
                    participantData: {
                        [user.uid]: { name: user.displayName, photo: user.photoURL },
                        [targetUser.uid]: { name: targetUser.displayName, photo: targetUser.photoURL }
                    },
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    lastMessage: ''
                };
                await setDoc(chatDocRef, newChatData);
                setActiveChat({ id: deterministicId, ...newChatData });
            } else {
                // Apenas abre se já existe
                setActiveChat({ id: deterministicId, ...chatSnap.data() });
            }
        } catch (error) {
            console.error("Erro openChat:", error);
            toast.error("Erro ao conectar.");
        }
    };

    return { chats, messages, activeChat, setActiveChat, sendMessage, openChatWithUser, loading };
};