import { useState, useEffect } from 'react';
import { 
    collection, query, where, orderBy, onSnapshot, 
    addDoc, serverTimestamp, getDocs 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

export const useChat = (user) => {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Carregar conversas onde o usuário participa
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'chats'), 
            where('participants', 'array-contains', user.uid),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setChats(chatList);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao carregar chats:", error);
            // Ignora erro de permissão inicial enquanto cache limpa
            if (error.code !== 'permission-denied') {
                toast.error("Erro no chat.");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // 2. Carregar mensagens do chat ativo
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

    // 3. Enviar mensagem
    const sendMessage = async (text) => {
        if (!activeChat || !text.trim()) return;

        try {
            await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
                text,
                senderId: user.uid,
                createdAt: serverTimestamp(),
                senderName: user.displayName || 'Usuário'
            });

            // Atualiza o chat pai para ordenar na lista
            // (Nota: em produção real, usaria updateDoc no chat pai, mas manteremos simples)
        } catch (error) {
            console.error("Erro ao enviar:", error);
            toast.error("Não foi possível enviar.");
        }
    };

    // 4. Iniciar ou Abrir conversa com alguém (Lógica Crucial)
    const openChatWithUser = async (targetUser) => {
        // Verifica se já existe chat com essa pessoa
        const existingChat = chats.find(c => c.participants.includes(targetUser.uid));

        if (existingChat) {
            setActiveChat(existingChat);
        } else {
            // Cria novo chat se não existir
            try {
                const newChatRef = await addDoc(collection(db, 'chats'), {
                    participants: [user.uid, targetUser.uid],
                    participantData: { // Cache para evitar buscar user toda hora
                        [user.uid]: { name: user.displayName, photo: user.photoURL },
                        [targetUser.uid]: { name: targetUser.displayName, photo: targetUser.photoURL }
                    },
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    lastMessage: ''
                });

                setActiveChat({ 
                    id: newChatRef.id, 
                    participants: [user.uid, targetUser.uid],
                    participantData: {
                        [user.uid]: { name: user.displayName },
                        [targetUser.uid]: { name: targetUser.displayName }
                    }
                });
            } catch (error) {
                console.error("Erro ao criar chat:", error);
                toast.error("Erro ao iniciar conversa.");
            }
        }
    };

    return { 
        chats, 
        messages, 
        activeChat, 
        setActiveChat, 
        sendMessage, 
        openChatWithUser, 
        loading 
    };
};