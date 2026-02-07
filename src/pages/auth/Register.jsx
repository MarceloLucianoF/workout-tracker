import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../hooks/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { register, error, loading, user } = useAuthContext();
  const navigate = useNavigate();

  // Se já estiver logado, redireciona
  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Senhas não conferem!"); 
      return;
    }
    try {
      await register(email, password, displayName);
      navigate('/home');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900 transition-colors">
      
      {/* Lado Esquerdo */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-gray-900 to-black items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
        <div className="relative z-10 p-12 text-white">
          <h1 className="text-5xl font-black mb-6">Comece sua jornada hoje.</h1>
          <ul className="space-y-4 text-lg text-gray-300">
            <li className="flex items-center gap-3">✅ Acompanhe sua evolução</li>
            <li className="flex items-center gap-3">✅ Gráficos de performance</li>
          </ul>
        </div>
      </div>

      {/* Lado Direito */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          
          <div className="text-center lg:text-left">
            <h2 className="lg:hidden text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter">Academy<span className="text-blue-600">Up</span></h2>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Crie sua conta 🚀</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Junte-se a milhares de atletas focados.</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Nome Completo</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: João Silva"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="seu@email.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Senha</label>
                <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="••••••"
                />
                </div>
                <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Confirmar</label>
                <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="••••••"
                />
                </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-600/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all transform active:scale-95"
            >
              {loading ? 'Criando...' : 'Cadastrar Gratuitamente'}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Já tem conta?{' '}
              <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                Fazer Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}