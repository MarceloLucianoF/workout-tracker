import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../hooks/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, loading, user } = useAuthContext(); // Puxamos 'user' também
  const navigate = useNavigate(); // Hook de navegação

  // Se já estiver logado, joga pra home
  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // O useEffect acima vai perceber a mudança e redirecionar, 
      // mas por garantia podemos navegar aqui também se o hook login retornar sucesso
      navigate('/home');
    } catch (err) {
      console.error("Erro no login", err);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900 transition-colors">
      
      {/* Lado Esquerdo (Visual) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-900 to-black items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
        <div className="relative z-10 p-12 text-white">
          <h1 className="text-6xl font-black mb-4 tracking-tighter">Academy<span className="text-blue-500">Up</span></h1>
          <p className="text-xl text-gray-300 max-w-md">
            "A única repetição ruim é aquela que você não fez."
          </p>
        </div>
      </div>

      {/* Lado Direito (Formulário) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          
          <div className="text-center lg:text-left">
            <h2 className="lg:hidden text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter">Academy<span className="text-blue-600">Up</span></h2>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Bem-vindo de volta! 👋</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Digite suas credenciais para acessar sua ficha.</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Senha</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
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
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-600/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar na Plataforma'}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Não tem uma conta?{' '}
              <Link to="/register" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                Criar conta grátis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}