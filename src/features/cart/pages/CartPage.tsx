import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { CartItemRow } from '../components/CartItemRow';
import { CartSummary } from '../components/CartSummary';
import { Button } from '@shared/components/ui/Button';
import { EmptyState } from '@shared/components/feedback/EmptyState';
import { Spinner } from '@shared/components/feedback/Spinner';

export function CartPage() {
  const { items, total, itemCount, isLoading, updateQuantity, removeItem } = useCart();
  const { status } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon="🛒"
        title="Tu carrito esta vacio"
        description="Agrega productos del catalogo para verlos aca."
        action={
          <Link to="/">
            <Button variant="secondary">Ir al catalogo</Button>
          </Link>
        }
      />
    );
  }

  const handleCheckout = () => {
    if (status !== 'authenticated') {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">Tu carrito</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
          {items.map((item) => (
            <CartItemRow
              key={item.productId}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <CartSummary subtotal={total} itemCount={itemCount} />
          <Button size="lg" onClick={handleCheckout}>
            Continuar a checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
