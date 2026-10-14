export interface RatingStarsProps {
  value: number;
  count?: number;
  size?: 'sm' | 'md';
  /** Si se define, las estrellas se vuelven clickeables (para formularios de review). */
  onChange?: (value: 1 | 2 | 3 | 4 | 5) => void;
}

const STARS = [1, 2, 3, 4, 5] as const;

/** Estrellas de calificacion. Modo lectura (con contador) o modo interactivo (onChange). */
export function RatingStars({ value, count, size = 'sm', onChange }: RatingStarsProps) {
  const sizeClass = size === 'sm' ? 'text-sm' : 'text-xl';
  const isInteractive = Boolean(onChange);

  return (
    <div className="flex items-center gap-1" role={isInteractive ? 'radiogroup' : undefined} aria-label="Calificacion">
      <div className={`flex ${sizeClass}`}>
        {STARS.map((star) => {
          const filled = star <= Math.round(value);
          if (!isInteractive) {
            return (
              <span key={star} aria-hidden="true" className={filled ? 'text-accent-500' : 'text-slate-300'}>
                ★
              </span>
            );
          }
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={star === value}
              aria-label={`${star} estrellas`}
              onClick={() => onChange?.(star)}
              className={`transition-colors ${filled ? 'text-accent-500' : 'text-slate-300'} hover:text-accent-400`}
            >
              ★
            </button>
          );
        })}
      </div>
      {typeof count === 'number' && (
        <span className="text-xs text-slate-500">({count})</span>
      )}
    </div>
  );
}
