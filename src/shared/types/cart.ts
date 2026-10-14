import type { Product } from './product';

/** Item del carrito: snapshot de los datos del producto al momento de agregarlo. */
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  /** Stock disponible al momento de agregar, para no permitir exceder cantidad. */
  maxStock: number;
}

export interface CartState {
  items: CartItem[];
  /** true mientras se hidrata el carrito persistido (Firestore) al iniciar sesion. */
  isLoading: boolean;
}

export type CartAction =
  | { type: 'HYDRATE'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' };
