import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import type { Order } from '@shared/types';
import { OrderStatusBadge } from '@shared/components/ui/Badge';
import { Spinner } from '@shared/components/feedback/Spinner';
import { ErrorMessage } from '@shared/components/feedback/ErrorMessage';
import { formatCurrency, formatDate } from '@shared/utils/format';
import { fetchOrderById } from '../services/orderService';

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const justCreated = Boolean((location.state as { justCreated?: boolean } | null)?.justCreated);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    fetchOrderById(orderId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError('Orden no encontrada.');
          return;
        }
        setOrder(data);
      })
      .catch(() => !cancelled && setError('No se pudo cargar la orden.'))
      .finally(() => !cancelled && setIsLoading(false));

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return <ErrorMessage message={error ?? 'Orden no encontrada.'} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/orders" className="text-sm text-brand-600 hover:underline">
        ← Volver a mis ordenes
      </Link>

      {justCreated && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ✓ Tu compra se confirmo con exito. Te enviamos un seguimiento: <strong>{order.trackingNumber}</strong>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Orden #{order.trackingNumber}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="text-sm text-slate-500">Realizada el {formatDate(order.createdAt)}</p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Productos</h2>
          <ul className="flex flex-col divide-y divide-slate-100">
            {order.items.map((item) => (
              <li key={item.productId} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.quantity} x {formatCurrency(item.price)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-base font-semibold text-slate-900">Direccion de envio</h2>
            <p className="text-sm text-slate-600">{order.shippingAddress.fullName}</p>
            <p className="text-sm text-slate-600">{order.shippingAddress.street}</p>
            <p className="text-sm text-slate-600">
              {order.shippingAddress.city}, {order.shippingAddress.province} ({order.shippingAddress.postalCode})
            </p>
            <p className="text-sm text-slate-600">{order.shippingAddress.phone}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Envio</span>
              <span>{order.shippingCost === 0 ? 'Gratis' : formatCurrency(order.shippingCost)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
