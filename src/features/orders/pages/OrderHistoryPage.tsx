import { Link } from 'react-router-dom';
import { useAuth } from '@features/auth/hooks/useAuth';
import { Button } from '@shared/components/ui/Button';
import { EmptyState } from '@shared/components/feedback/EmptyState';
import { ErrorMessage } from '@shared/components/feedback/ErrorMessage';
import { Skeleton } from '@shared/components/feedback/Skeleton';
import { useOrders } from '../hooks/useOrders';
import { OrderCard } from '../components/OrderCard';

export function OrderHistoryPage() {
  const { profile } = useAuth();
  const { orders, isLoading, error } = useOrders(profile?.uid);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">Mis ordenes</h1>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {!isLoading && !error && orders.length === 0 && (
        <EmptyState
          icon="📦"
          title="Todavia no hiciste ninguna compra"
          description="Cuando completes una compra, la vas a ver reflejada aca."
          action={
            <Link to="/">
              <Button variant="secondary">Ir al catalogo</Button>
            </Link>
          }
        />
      )}

      {!isLoading && orders.length > 0 && (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
