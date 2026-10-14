import { Link } from 'react-router-dom';
import type { Order } from '@shared/types';
import { OrderStatusBadge } from '@shared/components/ui/Badge';
import { formatCurrency, formatDate } from '@shared/utils/format';

export function OrderCard({ order }: { order: Order }) {
  return (
    <Link
      to={`/orders/${order.id}`}
      className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-800">Orden #{order.trackingNumber}</span>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-500">{order.items.length} producto(s)</span>
        <span className="text-base font-bold text-slate-900">{formatCurrency(order.total)}</span>
      </div>
    </Link>
  );
}
