import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../hooks/AuthContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Lógica do Convite
  const [coachCode, setCoachCode] = useState('');
  const [coachName, setCoachName] = useState(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [searchParams] = useSearchParams();

  const { register, user, authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/home');
  }, [user, navigate]);

  useEffect(() => {
      const codeFromUrl = searchParams.get('coach');
      if (codeFromUrl) {
          setCoachCode(codeFromUrl);
          verifyCoach(codeFromUrl);
      }
  }, [searchParams]);

  const verifyCoach = async (code) => {
      if (!code) return;
      setIsCheckingCode(true);
      try {
          const coachRef = doc(db, 'users', code.trim());
          const coachSnap = await getDoc(coachRef);
          
          if (coachSnap.exists() && (coachSnap.data().role === 'coach' || coachSnap.data().role === 'admin')) {
              setCoachName(coachSnap.data().displayName);
              toast.success(`Treinador encontrado: ${coachSnap.data().displayName}`);
          } else {
              setCoachName(null);
              toast.error("Código de treinador inválido.");
          }
      } catch (err) {
          console.error(err);
      } finally {
          setIsCheckingCode(false);
      }
  };

  const handleBlurCoachCode = () => {
      if(coachCode && !coachName) verifyCoach(coachCode);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) return toast.error("As senhas não conferem!");
    if (password.length < 6) return toast.error("Senha muito curta (mínimo 6).");

    let verifiedCoachId = null;
    if (coachCode.trim()) {
        if (!coachName) {
             return toast.error("Verifique o código do treinador antes de continuar.");
        }
        verifiedCoachId = coachCode.trim();
    }

    setLocalLoading(true);
    const loadingToast = toast.loading('Criando sua conta...');

    try {
      await register(email, password, displayName, { 
          coachId: verifiedCoachId,
          currentTrainingId: null 
      });
      toast.success(`Bem-vindo!`, { id: loadingToast });
      navigate('/home');
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Erro ao criar conta.", { id: loadingToast });
    } finally {
      setLocalLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900 transition-colors">
      
      {/* Lado Esquerdo (Banner) */}
      <div className="hidden lg:flex w-1/2 bg-gray-900 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
        
        <div className="relative z-10 p-12 text-white max-w-lg">
          <h1 className="text-5xl font-black mb-6 leading-tight">Construa sua melhor versão.</h1>
          <ul className="space-y-4 text-lg text-gray-200">
            <li className="flex items-center gap-3"><div className="bg-green-500/20 p-1 rounded-full text-green-400">✓</div> Acompanhe sua evolução</li>
            <li className="flex items-center gap-3"><div className="bg-blue-500/20 p-1 rounded-full text-blue-400">✓</div> Gráficos de performance</li>
            <li className="flex items-center gap-3"><div className="bg-purple-500/20 p-1 rounded-full text-purple-400">✓</div> Contato direto com seu coach</li>
          </ul>
        </div>
      </div>

      {/* Lado Direito (Form) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          
          <div className="text-center lg:text-left">
            <h2 className="lg:hidden text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter">Academy<span className="text-blue-600">Up</span></h2>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Crie sua conta 🚀</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Comece hoje mesmo.</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Nome Completo</label>
              <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Ex: João Silva" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="seu@email.com" />
            </div>

            {/* Grid de Senhas */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Senha</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            required 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-10" 
                            placeholder="••••••" 
                        />
                        {/* Botão Show/Hide SVG */}
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            )}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Confirmar</label>
                    <input 
                        type={showPassword ? "text" : "password"} 
                        required 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                        placeholder="••••••" 
                    />
                </div>
            </div>

            {/* CAMPO DE CÓDIGO DO TREINADOR */}
            <div className="pt-2">
                <label className="text-xs font-bold text-blue-500 uppercase ml-1 flex justify-between cursor-pointer group">
                    <span>Código do Treinador (Opcional)</span>
                    <span className="text-[10px] opacity-70 group-hover:opacity-100 transition-opacity">Peça ao seu coach</span>
                </label>
                <div className="relative mt-1">
                    {/* Ícone Ticket SVG */}
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                        </svg>
                    </div>
                    <input 
                        type="text" 
                        onBlur={handleBlurCoachCode}
                        onChange={(e) => { setCoachCode(e.target.value); setCoachName(null); }} 
                        value={coachCode}
                        className={`w-full bg-blue-50 dark:bg-blue-900/10 border p-3 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all font-mono tracking-wider text-sm ${coachName ? 'border-green-500' : 'border-blue-100 dark:border-blue-800/30'}`}
                        placeholder="Ex: CÓDIGO-DO-COACH"
                    />
                    {isCheckingCode && <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>}
                </div>
                {/* Feedback Visual do Nome do Coach */}
                {coachName && (
                    <div className="mt-2 flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg text-xs font-bold animate-fade-in border border-green-200 dark:border-green-900">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Treinador: {coachName}
                    </div>
                )}
            </div>

            <button
              type="submit"
              disabled={localLoading || isCheckingCode}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-600/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {localLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processando...
                  </span>
              ) : 'Cadastrar Gratuitamente'}
            </button>
          </form>

          <div className="text-center pt-2">
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