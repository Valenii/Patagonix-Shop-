import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { buildProduct, buildUserProfile } from '@test/utils/fixtures';
import type { CartItem } from '@shared/types';
import { AllProviders } from '@test/utils/renderWithProviders';
import { useCart } from '../useCart';

// Mockeamos la capa de servicios (Firebase) para testear el hook de forma
// totalmente aislada, sin tocar Firestore/Auth reales. vi.mock se hoistea
// automaticamente por Vitest, por eso puede ir despues de los imports.
vi.mock('@features/auth/services/authService', () => ({
  subscribeToAuthChanges: vi.fn((callback: (profile: unknown) => void) => {
    callback(buildUserProfile());
    return () => {};
  }),
  loginWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  registerWithEmail: vi.fn(),
  logout: vi.fn(),
}));

const fetchCartMock = vi.fn<(uid: string) => Promise<CartItem[]>>();
const saveCartMock = vi.fn<(uid: string, items: CartItem[]) => Promise<void>>();

vi.mock('../../services/cartService', () => ({
  fetchCart: (uid: string) => fetchCartMock(uid),
  saveCart: (uid: string, items: CartItem[]) => saveCartMock(uid, items),
}));

describe('useCart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCartMock.mockResolvedValue([]);
    saveCartMock.mockResolvedValue(undefined);
  });

  it('lanza un error si se usa fuera de un CartProvider', () => {
    const { result } = renderHook(() => {
      try {
        return useCart();
      } catch (error) {
        return error as Error;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
  });

  it('hidrata el carrito persistido del usuario autenticado', async () => {
    fetchCartMock.mockResolvedValueOnce([
      { productId: 'p1', name: 'Mochila', price: 1000, imageUrl: '', quantity: 2, maxStock: 5 },
    ]);

    const { result } = renderHook(() => useCart(), { wrapper: AllProviders });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(fetchCartMock).toHaveBeenCalledWith('user-1');
    expect(result.current.items).toHaveLength(1);
    expect(result.current.itemCount).toBe(2);
  });

  it('agregar, actualizar y eliminar items refleja el total correctamente', async () => {
    const { result } = renderHook(() => useCart(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const product = buildProduct({ id: 'p1', price: 200, stock: 10 });

    act(() => result.current.addItem(product, 3));
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.total).toBe(600);

    act(() => result.current.updateQuantity('p1', 1));
    await waitFor(() => expect(result.current.total).toBe(200));

    act(() => result.current.removeItem('p1'));
    await waitFor(() => expect(result.current.items).toHaveLength(0));
  });

  it('persiste el carrito en Firestore (debounced) cuando cambian los items', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { result } = renderHook(() => useCart(), { wrapper: AllProviders });

    await vi.waitFor(() => expect(result.current.isLoading).toBe(false));

    const product = buildProduct({ id: 'p1', stock: 10 });
    act(() => result.current.addItem(product, 1));

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    expect(saveCartMock).toHaveBeenCalledWith(
      'user-1',
      expect.arrayContaining([expect.objectContaining({ productId: 'p1', quantity: 1 })]),
    );

    vi.useRealTimers();
  });
});
