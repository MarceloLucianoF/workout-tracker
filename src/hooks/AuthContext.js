import React, { createContext, useContext } from 'react';
import { useAuth } from './useAuth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const auth = useAuth(); // Agora o useAuth traz user + userData

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext deve ser usado dentro de AuthProvider');
  }
  return context;
}