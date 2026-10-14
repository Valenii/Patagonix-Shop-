import { Link } from 'react-router-dom';
import type { Order, OrderStatus } from '@shared/types';
import { ORDER_STATUSES } from '@shared/types';
import { OrderStatusBadge } from '@shared/components/ui/Badge';
import { EmptyState } from '@shared/components/feedback/EmptyState';
import { formatCurrency, formatDate } from '@shared/utils/format';

export interface OrderTableProps {
  orders: Order[];
  onChangeStatus: (orderId: string, status: OrderStatus) => void;
}

export function OrderTable({ orders, onChangeStatus }: OrderTableProps) {
  if (orders.length === 0) {
    return <EmptyState title="No hay ordenes" description="Todavia no se registraron compras con este filtro." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Orden</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Cambiar estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-4 py-3">
                <Link to={`/orders/${order.id}`} className="font-medium text-brand-600 hover:underline">
                  #{order.trackingNumber}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{order.userEmail}</td>
              <td className="px-4 py-3 text-slate-600">{formatDate(order.createdAt)}</td>
              <td className="px-4 py-3 font-medium text-slate-800">{formatCurrency(order.total)}</td>
              <td className="px-4 py-3">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <select
                  value={order.status}
                  onChange={(event) => onChangeStatus(order.id, event.target.value as OrderStatus)}
                  aria-label={`Cambiar estado de la orden ${order.trackingNumber}`}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
