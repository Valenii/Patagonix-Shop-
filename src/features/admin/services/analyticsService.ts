import { fetchAllOrders } from '@features/orders/services/orderService';
import type { Order } from '@shared/types';

export interface SalesByDay {
  date: string; // YYYY-MM-DD
  revenue: number;
}

export interface TopProduct {
  name: string;
  unitsSold: number;
  revenue: number;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  ordersByStatus: Record<Order['status'], number>;
  salesByDay: SalesByDay[];
  topProducts: TopProduct[];
}

const REVENUE_STATUSES: Order['status'][] = ['processing', 'completed'];

function toDateKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

/**
 * Calcula metricas de ventas a partir de las ordenes existentes. No persiste
 * nada: se recalcula en el cliente (volumen esperado de un proyecto academico).
 * Solo cuentan como "ventas" las ordenes `processing`/`completed` (una `pending`
 * o `cancelled` no genero ingreso real).
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const orders = await fetchAllOrders('all');
  const revenueOrders = orders.filter((order) => REVENUE_STATUSES.includes(order.status));

  const totalRevenue = revenueOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const averageOrderValue = revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0;

  const ordersByStatus: Record<Order['status'], number> = {
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
  };
  for (const order of orders) ordersByStatus[order.status] += 1;

  const salesByDayMap = new Map<string, number>();
  for (const order of revenueOrders) {
    const key = toDateKey(order.createdAt);
    salesByDayMap.set(key, (salesByDayMap.get(key) ?? 0) + order.total);
  }
  const salesByDay = Array.from(salesByDayMap.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  const productMap = new Map<string, TopProduct>();
  for (const order of revenueOrders) {
    for (const item of order.items) {
      const existing = productMap.get(item.productId);
      if (existing) {
        existing.unitsSold += item.quantity;
        existing.revenue += item.price * item.quantity;
      } else {
        productMap.set(item.productId, {
          name: item.name,
          unitsSold: item.quantity,
          revenue: item.price * item.quantity,
        });
      }
    }
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  return { totalRevenue, totalOrders, averageOrderValue, ordersByStatus, salesByDay, topProducts };
}
