import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../hooks/AuthContext';
import { useAdmin } from '../../hooks/useAdmin';

export default function Navbar() {
  const { user, userProfile } = useAuthContext(); // Agora pegamos o userProfile também
  const { isAdmin } = useAdmin();
  const location = useLocation();

  // Função para checar rota ativa (suporta sub-rotas)
  const isActive = (path) => {
    if (path === '/home' && location.pathname === '/') return true;
    return location.pathname.startsWith(path);
  };

  // Lógica inteligente do Avatar
  const avatarUrl = userProfile?.photoURL || user?.photoURL;
  const displayName = userProfile?.displayName || user?.displayName;
  const initial = displayName?.charAt(0).toUpperCase() || 'U';

  // Ícones SVG Otimizados
  const Icons = {
    Home: ({ active }) => (
      <svg className={`w-6 h-6 transition-colors ${active ? 'fill-blue-600 text-blue-600' : 'fill-none text-gray-400'}`} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    Trainings: ({ active }) => (
      <svg className={`w-6 h-6 transition-colors ${active ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    History: ({ active }) => (
      <svg className={`w-6 h-6 transition-colors ${active ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    Profile: ({ active }) => (
      <svg className={`w-6 h-6 transition-colors ${active ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  };

  return (
    <>
      {/* ================= DESKTOP NAVBAR ================= */}
      <nav className="hidden md:flex bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50 h-20 transition-colors">
        <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
          
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-2xl text-white shadow-lg shadow-blue-600/20 group-hover:rotate-12 transition-transform">
              💪
            </div>
            <span className="text-2xl font-black text-gray-800 dark:text-white tracking-tighter">
              Academy<span className="text-blue-600">Up</span>
            </span>
          </Link>

          {/* Links Centrais */}
          {user && (
            <div className="flex items-center gap-8">
              <Link to="/home" className={`text-sm font-bold transition-colors hover:text-blue-600 ${isActive('/home') ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>
                Dashboard
              </Link>
              <Link to="/trainings" className={`text-sm font-bold transition-colors hover:text-blue-600 ${isActive('/trainings') ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>
                Treinos
              </Link>
              <Link to="/history" className={`text-sm font-bold transition-colors hover:text-blue-600 ${isActive('/history') ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>
                Histórico
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-sm font-bold text-orange-500 hover:text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full">
                  Painel Admin
                </Link>
              )}
            </div>
          )}

          {/* Área do Usuário (Direita) */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
                
                <Link to="/profile" className="flex items-center gap-3 group">
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-bold text-gray-800 dark:text-white group-hover:text-blue-600 transition-colors">
                      {displayName}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ver Perfil</p>
                  </div>
                  
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-transparent group-hover:border-blue-500 transition-all shadow-sm">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {initial}
                      </div>
                    )}
                  </div>
                </Link>
              </>
            ) : (
              <div className="flex gap-4">
                <Link to="/login" className="text-gray-600 dark:text-gray-300 font-bold hover:text-blue-600 py-2">Login</Link>
                <Link to="/register" className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-transform hover:scale-105">
                  Começar
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ================= MOBILE NAVBAR (Bottom Bar) ================= */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 pb-safe z-50">
          <div className="flex justify-between items-center px-6 h-16 relative">
            
            {/* 1. Home */}
            <Link to="/home" className="flex flex-col items-center justify-center w-12 gap-1 group">
              <Icons.Home active={isActive('/home')} />
              <span className={`text-[10px] font-bold ${isActive('/home') ? 'text-blue-600' : 'text-gray-400'}`}>Home</span>
            </Link>

            {/* 2. Treinos */}
            <Link to="/trainings" className="flex flex-col items-center justify-center w-12 gap-1 group">
              <Icons.Trainings active={isActive('/trainings')} />
              <span className={`text-[10px] font-bold ${isActive('/trainings') ? 'text-blue-600' : 'text-gray-400'}`}>Treinos</span>
            </Link>

            {/* 3. BOTÃO FLUTUANTE CENTRAL (Destaque) */}
            <div className="relative -top-6">
                <Link 
                  to="/trainings" 
                  className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-2xl shadow-xl shadow-blue-600/40 border-4 border-gray-50 dark:border-gray-900 transform active:scale-95 transition-all"
                >
                  💪
                </Link>
            </div>

            {/* 4. Histórico */}
            <Link to="/history" className="flex flex-col items-center justify-center w-12 gap-1 group">
              <Icons.History active={isActive('/history')} />
              <span className={`text-[10px] font-bold ${isActive('/history') ? 'text-blue-600' : 'text-gray-400'}`}>Histórico</span>
            </Link>

            {/* 5. Perfil (Mini Avatar) */}
            <Link to="/profile" className="flex flex-col items-center justify-center w-12 gap-1 group">
              <div className={`w-6 h-6 rounded-full overflow-hidden border ${isActive('/profile') ? 'border-blue-600' : 'border-transparent'}`}>
                 {avatarUrl ? (
                    <img src={avatarUrl} alt="Me" className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[8px] font-bold text-gray-500">
                        {initial}
                    </div>
                 )}
              </div>
              <span className={`text-[10px] font-bold ${isActive('/profile') ? 'text-blue-600' : 'text-gray-400'}`}>Perfil</span>
            </Link>

          </div>
        </div>
      )}
    </>
  );
}