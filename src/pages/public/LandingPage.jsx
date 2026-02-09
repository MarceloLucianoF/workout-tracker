import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="text-2xl font-black text-blue-600 tracking-tighter">AcademyUp⚡</div>
        <div className="flex gap-4">
          <button onClick={() => navigate('/login')} className="text-gray-600 dark:text-gray-300 font-bold hover:text-blue-600">Entrar</button>
          <button onClick={() => navigate('/register')} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2 rounded-full font-bold hover:opacity-90 transition-opacity">
            Começar Grátis
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in-up">
          Para Personal Trainers e Consultorias
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-6 leading-tight animate-fade-in-up">
          Escale sua consultoria <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">sem perder a qualidade.</span>
        </h1>
        
        <p className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-100">
          Abandone as planilhas. Tenha sua própria plataforma de treinos com app para alunos, chat integrado e gestão financeira automatizada.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up delay-200">
          <button 
            onClick={() => navigate('/register')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-600/30 transition-transform active:scale-95"
          >
            Criar Conta de Treinador
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white text-lg px-8 py-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Sou Aluno
          </button>
        </div>

        {/* Features Preview */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <FeatureCard 
                icon="📱" 
                title="App do Aluno" 
                desc="Seus alunos recebem o treino direto no celular, com vídeos e cronômetro." 
            />
            <FeatureCard 
                icon="⚡" 
                title="Fábrica de Treinos" 
                desc="Monte fichas em segundos usando nossa biblioteca ou crie seus exercícios." 
            />
            <FeatureCard 
                icon="💬" 
                title="Chat Integrado" 
                desc="Centralize a comunicação e pare de misturar trabalho com WhatsApp pessoal." 
            />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 mt-20 py-10 text-center text-gray-400 text-sm">
        <p>© 2024 AcademyUp SaaS. Feito para alta performance.</p>
      </footer>
    </div>
  );
}

const FeatureCard = ({ icon, title, desc }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-900 transition-colors shadow-sm">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </div>
);