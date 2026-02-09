import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../hooks/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, authLoading, user } = useAuthContext();
  const navigate = useNavigate();
  const [localLoading, setLocalLoading] = useState(false);

  // Redireciona se já logado
  useEffect(() => {
    if (user) navigate('/home');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalLoading(true);
    const toastId = toast.loading('Autenticando...');

    try {
      await login(email, password);
      toast.success('Bem-vindo de volta! 👋', { id: toastId });
      // O useEffect redireciona
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Erro ao entrar.", { id: toastId });
      setLocalLoading(false);
    }
  };

  if (authLoading) return null; // Evita flash

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900 transition-colors">
      
      {/* Lado Esquerdo (Visual - Igual ao Registro) */}
      <div className="hidden lg:flex w-1/2 bg-gray-900 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
        
        <div className="relative z-10 p-12 text-white max-w-lg">
          <h1 className="text-5xl font-black mb-6 leading-tight tracking-tight">
            Academy<span className="text-blue-500">Up</span>
          </h1>
          <p className="text-2xl font-light text-gray-200 mb-8 leading-relaxed">
            "A única repetição ruim é aquela que você não fez."
          </p>
          <div className="flex gap-2">
             <div className="h-1 w-12 bg-blue-500 rounded-full"></div>
             <div className="h-1 w-4 bg-gray-600 rounded-full"></div>
             <div className="h-1 w-4 bg-gray-600 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Lado Direito (Formulário) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          
          <div className="text-center lg:text-left">
            <h2 className="lg:hidden text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter">Academy<span className="text-blue-600">Up</span></h2>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Bem-vindo de volta! 👋</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Digite suas credenciais para acessar sua ficha.</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              
              {/* Email */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Email</label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="seu@email.com"
                />
              </div>

              {/* Senha */}
              <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                    <Link to="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors">
                        Esqueceu a senha?
                    </Link>
                </div>
                <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-12"
                      placeholder="••••••••"
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        )}
                    </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={localLoading}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-600/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {localLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Entrando...
                  </span>
              ) : 'Acessar Conta'}
            </button>
          </form>

          <div className="text-center pt-2">
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