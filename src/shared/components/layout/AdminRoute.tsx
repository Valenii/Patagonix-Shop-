import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@features/auth/hooks/useAuth';
import { Spinner } from '../feedback/Spinner';

/**
 * Exige sesion iniciada Y rol admin. Un customer autenticado que intenta
 * entrar al panel es redirigido a Home, no a Login (ya esta logueado).
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { status, isAdmin } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
