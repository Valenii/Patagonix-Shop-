import { formatCurrency } from '@shared/utils/format';

export interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
}

export function CartSummary({ subtotal, itemCount }: CartSummaryProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-base font-semibold text-slate-900">Resumen</h2>
      <div className="flex justify-between text-sm text-slate-600">
        <span>Productos ({itemCount})</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm text-slate-600">
        <span>Envio</span>
        <span className="text-emerald-600">Gratis</span>
      </div>
      <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
        <span>Total</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
    </div>
  );
}
