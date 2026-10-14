import { useEffect, useState } from 'react';
import type { Order } from '@shared/types';
import { fetchOrdersByUser } from '../services/orderService';

export function useOrders(userId: string | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetchOrdersByUser(userId)
      .then((data) => !cancelled && setOrders(data))
      .catch(() => !cancelled && setError('No se pudieron cargar tus ordenes.'))
      .finally(() => !cancelled && setIsLoading(false));

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { orders, isLoading, error };
}
