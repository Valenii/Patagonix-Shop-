import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useCart } from '@features/cart/hooks/useCart';
import { createOrder } from '@features/orders/services/orderService';
import { CartSummary } from '@features/cart/components/CartSummary';
import { ErrorMessage } from '@shared/components/feedback/ErrorMessage';
import type { ShippingAddress } from '@shared/types';
import { ShippingForm } from '../components/ShippingForm';

/**
 * Checkout simulado: no se integra ninguna pasarela de pago real (no es
 * requisito del proyecto). Al confirmar, se crea la orden en Firestore con
 * estado `pending`, se descuenta stock y se vacia el carrito.
 */
export function CheckoutPage() {
  const { profile } = useAuth();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const handleConfirm = async (shippingAddress: ShippingAddress) => {
    if (!profile) return;
    setIsSubmitting(true);
    setError(null);

    const result = await createOrder({
      userId: profile.uid,
      userEmail: profile.email,
      items,
      shippingAddress,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    clearCart();
    navigate(`/orders/${result.data.id}`, { state: { justCreated: true } });
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
      <p className="rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-700">
        💳 Este es un checkout simulado: no se procesa ningun pago real.
      </p>

      {error && <ErrorMessage message={error} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ShippingForm
            defaultValues={{ fullName: profile?.displayName }}
            isSubmitting={isSubmitting}
            onSubmit={handleConfirm}
          />
        </div>
        <CartSummary subtotal={total} itemCount={items.length} />
      </div>
    </div>
  );
}
