import { describe, expect, it } from 'vitest';
import { buildCartItem, buildProduct } from '@test/utils/fixtures';
import {
  cartReducer,
  initialCartState,
  selectCartItemCount,
  selectCartTotal,
} from '../cartReducer';

describe('cartReducer', () => {
  it('hidrata el carrito con los items persistidos y marca isLoading en false', () => {
    const persisted = [buildCartItem({ productId: 'a' }), buildCartItem({ productId: 'b' })];

    const state = cartReducer(initialCartState, { type: 'HYDRATE', payload: persisted });

    expect(state.items).toEqual(persisted);
    expect(state.isLoading).toBe(false);
  });

  describe('ADD_ITEM', () => {
    it('agrega un producto nuevo con cantidad 1 por defecto', () => {
      const product = buildProduct({ id: 'p1', stock: 5 });

      const state = cartReducer(initialCartState, { type: 'ADD_ITEM', payload: { product } });

      expect(state.items).toHaveLength(1);
      expect(state.items[0]).toMatchObject({ productId: 'p1', quantity: 1, maxStock: 5 });
    });

    it('suma la cantidad si el producto ya esta en el carrito', () => {
      const product = buildProduct({ id: 'p1', stock: 10 });
      const withOne = cartReducer(initialCartState, { type: 'ADD_ITEM', payload: { product } });

      const state = cartReducer(withOne, {
        type: 'ADD_ITEM',
        payload: { product, quantity: 2 },
      });

      expect(state.items).toHaveLength(1);
      expect(state.items[0]?.quantity).toBe(3);
    });

    it('nunca supera el stock disponible al agregar de a uno', () => {
      const product = buildProduct({ id: 'p1', stock: 2 });

      const state = cartReducer(initialCartState, {
        type: 'ADD_ITEM',
        payload: { product, quantity: 5 },
      });

      expect(state.items[0]?.quantity).toBe(2);
    });

    it('nunca supera el stock disponible al sumar cantidad a un item existente', () => {
      const product = buildProduct({ id: 'p1', stock: 3 });
      const withTwo = cartReducer(initialCartState, {
        type: 'ADD_ITEM',
        payload: { product, quantity: 2 },
      });

      const state = cartReducer(withTwo, {
        type: 'ADD_ITEM',
        payload: { product, quantity: 5 },
      });

      expect(state.items[0]?.quantity).toBe(3);
    });
  });

  describe('REMOVE_ITEM', () => {
    it('elimina el item indicado y deja el resto intacto', () => {
      const seed = { items: [buildCartItem({ productId: 'a' }), buildCartItem({ productId: 'b' })], isLoading: false };

      const state = cartReducer(seed, { type: 'REMOVE_ITEM', payload: { productId: 'a' } });

      expect(state.items).toHaveLength(1);
      expect(state.items[0]?.productId).toBe('b');
    });

    it('no rompe si se intenta eliminar un productId inexistente', () => {
      const seed = { items: [buildCartItem({ productId: 'a' })], isLoading: false };

      const state = cartReducer(seed, { type: 'REMOVE_ITEM', payload: { productId: 'no-existe' } });

      expect(state.items).toHaveLength(1);
    });
  });

  describe('UPDATE_QUANTITY', () => {
    it('actualiza la cantidad respetando el stock maximo', () => {
      const seed = { items: [buildCartItem({ productId: 'a', quantity: 1, maxStock: 5 })], isLoading: false };

      const state = cartReducer(seed, {
        type: 'UPDATE_QUANTITY',
        payload: { productId: 'a', quantity: 99 },
      });

      expect(state.items[0]?.quantity).toBe(5);
    });

    it('elimina el item si la cantidad se actualiza a 0 o menos', () => {
      const seed = { items: [buildCartItem({ productId: 'a' })], isLoading: false };

      const state = cartReducer(seed, {
        type: 'UPDATE_QUANTITY',
        payload: { productId: 'a', quantity: 0 },
      });

      expect(state.items).toHaveLength(0);
    });
  });

  it('CLEAR_CART vacia todos los items sin tocar isLoading', () => {
    const seed = { items: [buildCartItem()], isLoading: false };

    const state = cartReducer(seed, { type: 'CLEAR_CART' });

    expect(state.items).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('ignora acciones desconocidas devolviendo el mismo estado', () => {
    const seed = { items: [buildCartItem()], isLoading: false };

    // @ts-expect-error - accion invalida a proposito para testear el default case
    const state = cartReducer(seed, { type: 'NOPE' });

    expect(state).toBe(seed);
  });
});

describe('selectors', () => {
  it('selectCartTotal suma precio * cantidad de todos los items', () => {
    const items = [
      buildCartItem({ price: 100, quantity: 2 }),
      buildCartItem({ productId: 'b', price: 50, quantity: 3 }),
    ];

    expect(selectCartTotal(items)).toBe(350);
  });

  it('selectCartItemCount suma las cantidades de todos los items', () => {
    const items = [
      buildCartItem({ quantity: 2 }),
      buildCartItem({ productId: 'b', quantity: 3 }),
    ];

    expect(selectCartItemCount(items)).toBe(5);
  });

  it('ambos selectores devuelven 0 con el carrito vacio', () => {
    expect(selectCartTotal([])).toBe(0);
    expect(selectCartItemCount([])).toBe(0);
  });
});
