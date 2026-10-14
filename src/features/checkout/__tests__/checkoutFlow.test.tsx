import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildProduct, buildUserProfile } from '@test/utils/fixtures';
import { renderWithProviders } from '@test/utils/renderWithProviders';
import { MainLayout } from '@shared/components/layout/MainLayout';
import { ProductDetailPage } from '@features/catalog/pages/ProductDetailPage';
import { CartPage } from '@features/cart/pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { createOrder } from '@features/orders/services/orderService';
import { saveCart } from '@features/cart/services/cartService';
import type { CreateOrderInput, Order, Result } from '@shared/types';

// Test de integracion: recorre el flujo real de compra (detalle de producto ->
// carrito -> checkout -> orden creada) con los providers reales (Auth + Cart +
// Router). Solo se mockea la capa de servicios, asi no se toca Firebase.
vi.mock('@shared/lib/firebase', () => ({ auth: {}, db: {} }));

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

vi.mock('@features/cart/services/cartService', () => ({
  fetchCart: vi.fn().mockResolvedValue([]),
  saveCart: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@features/catalog/services/productService', () => ({
  fetchProductById: vi.fn(async () => buildProduct({ id: 'product-1', name: 'Campera impermeable', price: 45000, stock: 5 })),
}));

vi.mock('@features/reviews/services/reviewService', () => ({
  fetchProductReviews: vi.fn().mockResolvedValue([]),
  createReview: vi.fn(),
}));

vi.mock('@features/orders/services/orderService', () => ({
  createOrder: vi.fn(),
}));

const createOrderMock = vi.mocked(createOrder);

function renderShop() {
  return renderWithProviders(
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="products/:productId" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="orders/:orderId" element={<p>Pantalla de detalle de orden</p>} />
      </Route>
    </Routes>,
    { initialEntries: ['/products/product-1'] },
  );
}

/** Agrega 2 unidades desde el detalle, va al carrito y luego al checkout. */
async function addTwoUnitsAndGoToCheckout(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('heading', { name: 'Campera impermeable' });

  await user.click(screen.getByRole('button', { name: 'Aumentar cantidad' }));
  await user.click(screen.getByRole('button', { name: /agregar al carrito/i }));
  expect(await screen.findByRole('status')).toHaveTextContent(/agregado al carrito/i);

  await user.click(screen.getByRole('link', { name: /carrito, 2 items/i }));
  await screen.findByRole('heading', { name: /tu carrito/i });

  await user.click(screen.getByRole('button', { name: /continuar a checkout/i }));
  await screen.findByRole('heading', { name: /checkout/i });
}

async function fillShippingForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Direccion'), 'Av. Siempre Viva 742');
  await user.type(screen.getByLabelText('Ciudad'), 'Bariloche');
  await user.type(screen.getByLabelText('Provincia'), 'Rio Negro');
  await user.type(screen.getByLabelText('Codigo postal'), '8400');
  await user.type(screen.getByLabelText('Telefono'), '2944123456');
}

describe('Flujo de compra (integracion)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('agrega un producto, confirma el checkout, crea la orden y vacia el carrito', async () => {
    createOrderMock.mockImplementation(
      async (input: CreateOrderInput): Promise<Result<Order>> => ({
        ok: true,
        data: {
          id: 'order-123',
          userId: input.userId,
          userEmail: input.userEmail,
          items: input.items,
          subtotal: 90000,
          shippingCost: 0,
          total: 90000,
          status: 'pending',
          shippingAddress: input.shippingAddress,
          trackingNumber: 'PTX-TEST',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      }),
    );
    const user = userEvent.setup();
    renderShop();

    await addTwoUnitsAndGoToCheckout(user);

    // El resumen del checkout refleja el total calculado por el carrito (2 x 45.000).
    const summary = screen.getByRole('heading', { name: 'Resumen' }).parentElement as HTMLElement;
    expect(within(summary).getAllByText(/90\.000/).length).toBeGreaterThan(0);

    await fillShippingForm(user);
    await user.click(screen.getByRole('button', { name: /confirmar compra/i }));

    await screen.findByText('Pantalla de detalle de orden');

    expect(createOrderMock).toHaveBeenCalledTimes(1);
    expect(createOrderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        items: [expect.objectContaining({ productId: 'product-1', quantity: 2, price: 45000 })],
        shippingAddress: expect.objectContaining({ city: 'Bariloche', postalCode: '8400' }),
      }),
    );

    // El carrito quedo vacio: el contador del navbar vuelve a 0.
    expect(screen.getByRole('link', { name: /carrito, 0 items/i })).toBeInTheDocument();
    await waitFor(() => expect(vi.mocked(saveCart)).toHaveBeenLastCalledWith('user-1', []), { timeout: 2000 });
  });

  it('no envia la orden si el formulario de envio es invalido', async () => {
    const user = userEvent.setup();
    renderShop();

    await addTwoUnitsAndGoToCheckout(user);
    await user.click(screen.getByRole('button', { name: /confirmar compra/i }));

    expect(await screen.findByText('Ingresa tu direccion.')).toBeInTheDocument();
    expect(screen.getByText(/codigo postal invalido/i)).toBeInTheDocument();
    expect(createOrderMock).not.toHaveBeenCalled();
  });

  it('muestra el error y conserva el carrito si la orden falla (ej: sin stock)', async () => {
    createOrderMock.mockResolvedValue({
      ok: false,
      error: 'No hay stock suficiente de "Campera impermeable" (quedan 1).',
    });
    const user = userEvent.setup();
    renderShop();

    await addTwoUnitsAndGoToCheckout(user);
    await fillShippingForm(user);
    await user.click(screen.getByRole('button', { name: /confirmar compra/i }));

    expect(await screen.findByText(/no hay stock suficiente/i)).toBeInTheDocument();
    expect(screen.queryByText('Pantalla de detalle de orden')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /carrito, 2 items/i })).toBeInTheDocument();
  });
});
