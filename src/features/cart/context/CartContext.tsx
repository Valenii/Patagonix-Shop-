import {
  createContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import type { CartItem, Product } from '@shared/types';
import { useAuth } from '@features/auth/hooks/useAuth';
import { fetchCart, saveCart } from '../services/cartService';
import {
  cartReducer,
  initialCartState,
  selectCartItemCount,
  selectCartTotal,
  type CartState,
} from './cartReducer';

export interface CartContextValue extends CartState {
  total: number;
  itemCount: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);

const PERSIST_DEBOUNCE_MS = 600;

export function CartProvider({ children }: { children: ReactNode }) {
  const { profile, status } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHydratedForUid = useRef<string | null>(null);

  // Hidrata el carrito desde Firestore cuando cambia el usuario autenticado.
  useEffect(() => {
    if (status === 'loading') return;

    if (!profile) {
      dispatch({ type: 'HYDRATE', payload: [] });
      hasHydratedForUid.current = null;
      return;
    }

    if (hasHydratedForUid.current === profile.uid) return;

    let cancelled = false;
    fetchCart(profile.uid)
      .then((items: CartItem[]) => {
        if (!cancelled) {
          dispatch({ type: 'HYDRATE', payload: items });
          hasHydratedForUid.current = profile.uid;
        }
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'HYDRATE', payload: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [profile, status]);

  // Persiste en Firestore (debounced) cada vez que cambian los items, solo si hay usuario.
  useEffect(() => {
    if (state.isLoading || !profile) return;

    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      void saveCart(profile.uid, state.items);
    }, PERSIST_DEBOUNCE_MS);

    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [state.items, state.isLoading, profile]);

  const value = useMemo<CartContextValue>(
    () => ({
      ...state,
      total: selectCartTotal(state.items),
      itemCount: selectCartItemCount(state.items),
      addItem: (product, quantity = 1) => dispatch({ type: 'ADD_ITEM', payload: { product, quantity } }),
      removeItem: (productId) => dispatch({ type: 'REMOVE_ITEM', payload: { productId } }),
      updateQuantity: (productId, quantity) =>
        dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } }),
      clearCart: () => dispatch({ type: 'CLEAR_CART' }),
    }),
    [state],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
