import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { CartItem } from '@shared/types';
import { fetchCart, saveCart } from '../cartService';

// Mock del Firebase SDK (firestore) a nivel de modulo: ningun test de esta
// suite toca una base de datos real. `db` tambien se mockea para que
// `doc(db, ...)` reciba algo serializable.
const getDocMock = vi.fn();
const setDocMock = vi.fn();
const docMock = vi.fn((_db: unknown, collection: string, id: string) => ({ collection, id }));

vi.mock('firebase/firestore', () => ({
  doc: (...args: Parameters<typeof docMock>) => docMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  serverTimestamp: () => 'SERVER_TIMESTAMP',
}));

vi.mock('@shared/lib/firebase', () => ({ db: {} }));

describe('cartService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchCart', () => {
    it('devuelve [] cuando el usuario todavia no tiene carrito persistido', async () => {
      getDocMock.mockResolvedValue({ exists: () => false });

      const items = await fetchCart('user-1');

      expect(items).toEqual([]);
      expect(docMock).toHaveBeenCalledWith({}, 'carts', 'user-1');
    });

    it('devuelve los items guardados cuando el doc existe', async () => {
      const items: CartItem[] = [
        { productId: 'p1', name: 'Mochila', price: 1000, imageUrl: '', quantity: 1, maxStock: 5 },
      ];
      getDocMock.mockResolvedValue({ exists: () => true, data: () => ({ items }) });

      const result = await fetchCart('user-1');

      expect(result).toEqual(items);
    });

    it('devuelve [] si el campo items no es un array (dato corrupto)', async () => {
      getDocMock.mockResolvedValue({ exists: () => true, data: () => ({ items: 'no-es-array' }) });

      const result = await fetchCart('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('saveCart', () => {
    it('hace upsert (merge: true) del carrito del usuario', async () => {
      const items: CartItem[] = [
        { productId: 'p1', name: 'Mochila', price: 1000, imageUrl: '', quantity: 2, maxStock: 5 },
      ];

      await saveCart('user-1', items);

      expect(setDocMock).toHaveBeenCalledWith(
        { collection: 'carts', id: 'user-1' },
        expect.objectContaining({ items, updatedAt: 'SERVER_TIMESTAMP' }),
        { merge: true },
      );
    });
  });
});
