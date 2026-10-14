import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildCartItem } from '@test/utils/fixtures';
import type { CreateOrderInput } from '@shared/types';
import { createOrder } from '../orderService';

// Firestore mockeado: simulamos la transaccion para verificar la logica de
// negocio (stock, precio al momento de compra) sin tocar la base real.
interface FakeProduct {
  name: string;
  price: number;
  stock: number;
}

const { products, txSet, txUpdate } = vi.hoisted(() => ({
  products: new Map<string, FakeProduct>(),
  txSet: vi.fn(),
  txUpdate: vi.fn(),
}));

vi.mock('@shared/lib/firebase', () => ({ db: {} }));

vi.mock('firebase/firestore', () => {
  class Timestamp {
    toMillis() {
      return 0;
    }
  }
  return {
    Timestamp,
    collection: vi.fn(() => ({})),
    doc: vi.fn((_db: unknown, col?: string, id?: string) => ({ id: id ?? 'order-1', col })),
    serverTimestamp: vi.fn(() => 'SERVER_TS'),
    getDoc: vi.fn(async () => ({
      id: 'order-1',
      exists: () => true,
      data: () => txSet.mock.calls[0]?.[1] ?? {},
    })),
    runTransaction: vi.fn(async (_db: unknown, fn: (tx: unknown) => Promise<void>) =>
      fn({
        get: async (ref: { id: string }) => {
          const product = products.get(ref.id);
          return { exists: () => product !== undefined, data: () => product };
        },
        set: txSet,
        update: txUpdate,
      }),
    ),
    getDocs: vi.fn(),
    orderBy: vi.fn(),
    query: vi.fn(),
    updateDoc: vi.fn(),
    where: vi.fn(),
  };
});

function buildInput(overrides: Partial<CreateOrderInput> = {}): CreateOrderInput {
  return {
    userId: 'user-1',
    userEmail: 'cliente@patagonix.test',
    items: [buildCartItem({ productId: 'p1', name: 'Campera', price: 45000, quantity: 2 })],
    shippingAddress: {
      fullName: 'Cliente',
      street: 'Calle 1',
      city: 'Bariloche',
      province: 'Rio Negro',
      postalCode: '8400',
      phone: '2944123456',
    },
    ...overrides,
  };
}

describe('createOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    products.clear();
  });

  it('crea la orden pending y descuenta el stock en la misma transaccion', async () => {
    products.set('p1', { name: 'Campera', price: 45000, stock: 5 });

    const result = await createOrder(buildInput());

    expect(result.ok).toBe(true);
    expect(txSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'pending', subtotal: 90000, total: 90000 }),
    );
    expect(txUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }), expect.objectContaining({ stock: 3 }));
  });

  it('guarda el precio y nombre actuales del producto, no los del carrito', async () => {
    products.set('p1', { name: 'Campera Pro', price: 50000, stock: 5 });

    await createOrder(buildInput());

    const orderPayload = txSet.mock.calls[0]?.[1];
    expect(orderPayload.items[0]).toMatchObject({ name: 'Campera Pro', price: 50000, quantity: 2 });
    expect(orderPayload.subtotal).toBe(100000);
  });

  it('rechaza la compra sin escribir nada si no hay stock suficiente', async () => {
    products.set('p1', { name: 'Campera', price: 45000, stock: 1 });

    const result = await createOrder(buildInput());

    expect(result).toEqual({ ok: false, error: 'No hay stock suficiente de "Campera" (quedan 1).' });
    expect(txSet).not.toHaveBeenCalled();
    expect(txUpdate).not.toHaveBeenCalled();
  });

  it('rechaza la compra si el producto fue eliminado del catalogo', async () => {
    const result = await createOrder(buildInput());

    expect(result).toEqual({ ok: false, error: '"Campera" ya no esta disponible.' });
    expect(txSet).not.toHaveBeenCalled();
  });

  it('si uno de varios productos no tiene stock, no se descuenta ninguno', async () => {
    products.set('p1', { name: 'Campera', price: 45000, stock: 5 });
    products.set('p2', { name: 'Mochila', price: 30000, stock: 0 });

    const result = await createOrder(
      buildInput({
        items: [
          buildCartItem({ productId: 'p1', name: 'Campera', quantity: 1 }),
          buildCartItem({ productId: 'p2', name: 'Mochila', quantity: 1 }),
        ],
      }),
    );

    expect(result.ok).toBe(false);
    expect(txUpdate).not.toHaveBeenCalled();
  });
});
