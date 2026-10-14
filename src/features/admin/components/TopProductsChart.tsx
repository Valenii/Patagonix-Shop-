import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TopProduct } from '../services/analyticsService';
import { EmptyState } from '@shared/components/feedback/EmptyState';

const ACCENT_HUE = '#f59e0b';

/** Ranking de productos mas vendidos. Un solo hue: el eje ya identifica cada categoria. */
export function TopProductsChart({ data }: { data: TopProduct[] }) {
  if (data.length === 0) {
    return <EmptyState title="Sin datos todavia" description="Los productos mas vendidos apareceran aca." />;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fill: '#334155', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number) => [`${value} unidades`, 'Vendidos']}
            contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 13 }}
          />
          <Bar dataKey="unitsSold" fill={ACCENT_HUE} radius={[0, 4, 4, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
