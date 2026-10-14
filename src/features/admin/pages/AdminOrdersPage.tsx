import { useEffect, useState } from 'react';
import type { Order, OrderStatus } from '@shared/types';
import { ORDER_STATUSES } from '@shared/types';
import { fetchAllOrders, updateOrderStatus } from '@features/orders/services/orderService';
import { Select } from '@shared/components/ui/Select';
import { Spinner } from '@shared/components/feedback/Spinner';
import { ErrorMessage } from '@shared/components/feedback/ErrorMessage';
import { OrderTable } from '../components/OrderTable';

const STATUS_OPTIONS = [{ value: 'all', label: 'Todos los estados' }, ...ORDER_STATUSES.map((s) => ({ value: s, label: s }))];

export function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = (filter: OrderStatus | 'all') => {
    setIsLoading(true);
    fetchAllOrders(filter)
      .then(setOrders)
      .catch(() => setError('No se pudieron cargar las ordenes.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => loadOrders(statusFilter), [statusFilter]);

  const handleChangeStatus = async (orderId: string, status: OrderStatus) => {
    const previous = orders;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));

    const result = await updateOrderStatus(orderId, status);
    if (!result.ok) {
      setOrders(previous);
      setError(result.error);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Ordenes</h1>
        <div className="w-48">
          <Select
            label="Filtrar por estado"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as OrderStatus | 'all')}
          />
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => loadOrders(statusFilter)} />}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
      ) : (
        <OrderTable orders={orders} onChangeStatus={handleChangeStatus} />
      )}
    </div>
  );
}
