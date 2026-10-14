import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@features/auth/context/AuthContext';
import { CartProvider } from '@features/cart/context/CartContext';

/**
 * Composicion de todos los providers globales de la app.
 * Orden importa: CartProvider depende de useAuth (para saber de quien es el carrito),
 * por lo tanto debe ir DENTRO de AuthProvider.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
