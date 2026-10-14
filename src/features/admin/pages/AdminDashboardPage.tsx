import { useEffect, useState } from 'react';
import { getAnalyticsSummary, type AnalyticsSummary } from '../services/analyticsService';
import { formatCurrency } from '@shared/utils/format';
import { Spinner } from '@shared/components/feedback/Spinner';
import { ErrorMessage } from '@shared/components/feedback/ErrorMessage';
import { StatCard } from '../components/StatCard';
import { SalesChart } from '../components/SalesChart';
import { TopProductsChart } from '../components/TopProductsChart';

const STATUS_LABELS = {
  pending: 'Pendientes',
  processing: 'En proceso',
  completed: 'Completadas',
  cancelled: 'Canceladas',
} as const;

const STATUS_ACCENT = {
  pending: 'text-amber-600',
  processing: 'text-blue-600',
  completed: 'text-emerald-600',
  cancelled: 'text-red-600',
} as const;

/** Dashboard de analytics (extra credit): ventas, productos mas vendidos, ordenes por estado. */
export function AdminDashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalyticsSummary()
      .then(setSummary)
      .catch(() => setError('No se pudieron calcular las metricas.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !summary) {
    return <ErrorMessage message={error ?? 'Sin datos disponibles.'} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Ingresos totales" value={formatCurrency(summary.totalRevenue)} accentClassName="text-brand-700" />
        <StatCard label="Ordenes totales" value={String(summary.totalOrders)} />
        <StatCard label="Ticket promedio" value={formatCurrency(summary.averageOrderValue)} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>).map((status) => (
          <StatCard
            key={status}
            label={STATUS_LABELS[status]}
            value={String(summary.ordersByStatus[status])}
            accentClassName={STATUS_ACCENT[status]}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-base font-semibold text-slate-900">Ingresos (ultimos 14 dias con ventas)</h2>
          <SalesChart data={summary.salesByDay} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-base font-semibold text-slate-900">Productos mas vendidos</h2>
          <TopProductsChart data={summary.topProducts} />
        </div>
      </div>
    </div>
  );
}
