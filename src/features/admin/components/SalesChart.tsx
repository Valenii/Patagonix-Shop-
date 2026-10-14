import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SalesByDay } from '../services/analyticsService';
import { formatCurrency } from '@shared/utils/format';
import { EmptyState } from '@shared/components/feedback/EmptyState';

const BRAND_HUE = '#1c6ff0';

function formatShortDate(dateKey: string): string {
  const [, month, day] = dateKey.split('-');
  return `${day}/${month}`;
}

/** Serie unica (ingresos por dia) -> un solo hue, sin necesidad de leyenda. */
export function SalesChart({ data }: { data: SalesByDay[] }) {
  if (data.length === 0) {
    return <EmptyState title="Todavia no hay ventas" description="Las ventas confirmadas apareceran aca." />;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND_HUE} stopOpacity={0.25} />
              <stop offset="100%" stopColor={BRAND_HUE} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatShortDate}
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => formatCurrency(v)}
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
            labelFormatter={(label: string) => formatShortDate(label)}
            contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 13 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={BRAND_HUE}
            strokeWidth={2}
            fill="url(#salesFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
