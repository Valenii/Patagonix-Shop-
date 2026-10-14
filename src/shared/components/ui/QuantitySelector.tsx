export interface QuantitySelectorProps {
  quantity: number;
  max: number;
  onChange: (quantity: number) => void;
}

/** Selector +/- de cantidad, respeta el stock maximo disponible. */
export function QuantitySelector({ quantity, max, onChange }: QuantitySelectorProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-300">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
        aria-label="Disminuir cantidad"
        className="px-3 py-2 text-slate-600 hover:bg-slate-100 disabled:text-slate-300"
      >
        −
      </button>
      <span className="w-10 text-center text-sm font-medium" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        aria-label="Aumentar cantidad"
        className="px-3 py-2 text-slate-600 hover:bg-slate-100 disabled:text-slate-300"
      >
        +
      </button>
    </div>
  );
}
