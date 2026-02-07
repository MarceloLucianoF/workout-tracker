import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../hooks/AuthContext';
import { useAdmin } from '../../hooks/useAdmin'; // Para checar se é admin

export default function Navbar() {
  const { user, logout } = useAuthContext();
  const { isAdmin } = useAdmin();
  const location = useLocation();

  // Função para verificar se o link está ativo (para pintar de azul)
  const isActive = (path) => location.pathname === path;

  // Ícones SVG (simples e leves)
  const Icons = {
    Home: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    Trainings: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    History: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Profile: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    Admin: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  };

  return (
    <>
      {/* --- DESKTOP NAVBAR (Top Bar) --- */}
      <nav className="hidden md:flex bg-white dark:bg-gray-800 shadow-sm transition-colors border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-3xl">🦾</span>
              <span className="text-2xl font-black text-gray-800 dark:text-white tracking-tighter group-hover:text-blue-600 transition-colors">
                Academy<span className="text-blue-600 group-hover:text-gray-800 dark:group-hover:text-white">Up</span>
              </span>
            </Link>

            {/* Links Desktop */}
            {user ? (
              <div className="flex items-center space-x-8">
                <Link to="/home" className={`font-medium transition-colors hover:text-blue-600 ${isActive('/home') ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}>Dashboard</Link>
                <Link to="/trainings" className={`font-medium transition-colors hover:text-blue-600 ${isActive('/trainings') ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}>Treinos</Link>
                <Link to="/history" className={`font-medium transition-colors hover:text-blue-600 ${isActive('/history') ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}>Histórico</Link>
                {isAdmin && <Link to="/admin" className="text-red-500 font-bold hover:text-red-600">Admin</Link>}
                
                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-4"></div>
                
                <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-bold text-gray-800 dark:text-white">{user.displayName}</p>
                    <p className="text-xs text-gray-500">Ver Perfil</p>
                  </div>
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {user.displayName?.charAt(0).toUpperCase()}
                  </div>
                </Link>
              </div>
            ) : (
              <div className="space-x-4">
                <Link to="/login" className="text-gray-600 dark:text-gray-300 font-medium hover:text-blue-600">Login</Link>
                <Link to="/register" className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">Criar Conta</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* --- MOBILE NAVBAR (Bottom Tab Bar) --- */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 pb-safe">
          <div className="flex justify-around items-center h-16">
            
            <Link to="/home" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/home') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
              <Icons.Home />
              <span className="text-[10px] font-bold">Home</span>
            </Link>

            <Link to="/trainings" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/trainings') || location.pathname.includes('/training/') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
              <Icons.Trainings />
              <span className="text-[10px] font-bold">Treinos</span>
            </Link>

            {/* Botão Central de Destaque (Opcional - Estilo Instagram/Strava) */}
            <div className="relative -top-5">
               <Link to="/trainings" className="flex items-center justify-center w-14 h-14 bg-blue-600 rounded-full text-white shadow-lg shadow-blue-600/40 hover:scale-105 transition-transform border-4 border-gray-50 dark:border-gray-900">
                 <span className="text-2xl">💪</span>
               </Link>
            </div>

            <Link to="/history" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/history') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
              <Icons.History />
              <span className="text-[10px] font-bold">Histórico</span>
            </Link>

            <Link to="/profile" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/profile') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
              {/* Mostra avatar pequeno se estiver ativo, senão ícone */}
              {isActive('/profile') ? (
                 <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                    {user.displayName?.charAt(0).toUpperCase()}
                 </div>
              ) : (
                 <Icons.Profile />
              )}
              <span className="text-[10px] font-bold">Perfil</span>
            </Link>

          </div>
        </div>
      )}
    </>
  );
}