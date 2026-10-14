import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '../context/AuthContext';

/** Acceso tipado al contexto de autenticacion. Lanza si se usa fuera del AuthProvider. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>.');
  }
  return context;
}
