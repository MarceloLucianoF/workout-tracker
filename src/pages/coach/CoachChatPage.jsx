import React, { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '../../hooks/AuthContext';
import { useChat } from '../../hooks/useChat';
import { useNavigate, useLocation } from 'react-router-dom';

export default function CoachChatPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { chats, messages, activeChat, setActiveChat, sendMessage, openChatWithUser, loading } = useChat(user);
  
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll para o fim
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Verifica se veio um aluno para abrir chat direto (vindo do Dashboard)
  useEffect(() => {
      if (location.state?.targetUser) {
          openChatWithUser(location.state.targetUser);
      }
  }, [location.state]);

  const handleSend = (e) => {
      e.preventDefault();
      sendMessage(inputText);
      setInputText('');
  };

  // Formata Data
  const formatTime = (timestamp) => {
      if (!timestamp) return '';
      return new Date(timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div></div>;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      
      {/* --- SIDEBAR (LISTA DE CHATS) --- */}
      <div className={`w-full md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Mensagens</h2>
            <button onClick={() => navigate('/coach/dashboard')} className="text-xs text-gray-500 hover:text-blue-500">Voltar</button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                    Nenhuma conversa iniciada. Vá ao Dashboard para falar com um aluno.
                </div>
            ) : (
                chats.map(chat => (
                    <div 
                        key={chat.id}
                        onClick={() => setActiveChat(chat)}
                        className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-700/50 ${activeChat?.id === chat.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''}`}
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                            {chat.studentName ? chat.studentName[0].toUpperCase() : '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-bold text-gray-800 dark:text-white text-sm truncate">{chat.studentName || 'Aluno'}</h3>
                                <span className="text-[10px] text-gray-400">{formatTime(chat.lastMessageTime)}</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{chat.lastMessage}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* --- ÁREA DO CHAT --- */}
      <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
            <>
                {/* Header Chat */}
                <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 shadow-sm z-10">
                    <button onClick={() => setActiveChat(null)} className="md:hidden text-gray-500 pr-2">←</button>
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg">
                        👤
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">{activeChat.studentName || 'Aluno'}</h3>
                        <p className="text-xs text-green-500 font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Online (Simulado)
                        </p>
                    </div>
                </div>

                {/* Mensagens */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => {
                        const isMe = msg.senderId === user.uid;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-sm ${
                                    isMe 
                                    ? 'bg-blue-600 text-white rounded-tr-none' 
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-700'
                                }`}>
                                    <p>{msg.text}</p>
                                    <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                        {formatTime(msg.createdAt)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto">
                        <input 
                            type="text" 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Digite uma mensagem..."
                            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        <button 
                            type="submit" 
                            disabled={!inputText.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ➤
                        </button>
                    </form>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <div className="text-6xl mb-4 opacity-20">💬</div>
                <p>Selecione um aluno para iniciar a conversa.</p>
            </div>
        )}
      </div>
    </div>
  );
}