import type { CartItem } from '@shared/types';
import { QuantitySelector } from '@shared/components/ui/QuantitySelector';
import { formatCurrency } from '@shared/utils/format';

export interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-4 last:border-b-0">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl text-slate-300">📦</div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
        <p className="text-sm text-slate-500">{formatCurrency(item.price)}</p>
      </div>

      <QuantitySelector
        quantity={item.quantity}
        max={item.maxStock}
        onChange={(quantity) => onUpdateQuantity(item.productId, quantity)}
      />

      <p className="w-20 shrink-0 text-right text-sm font-semibold text-slate-800">
        {formatCurrency(item.price * item.quantity)}
      </p>

      <button
        type="button"
        onClick={() => onRemove(item.productId)}
        aria-label={`Eliminar ${item.name} del carrito`}
        className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
      >
        🗑️
      </button>
    </div>
  );
}
