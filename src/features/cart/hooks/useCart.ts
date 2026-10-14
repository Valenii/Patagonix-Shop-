import { useContext } from 'react';
import { CartContext, type CartContextValue } from '../context/CartContext';

/** Acceso tipado al contexto del carrito. Lanza si se usa fuera del CartProvider. */
export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de un <CartProvider>.');
  }
  return context;
}
