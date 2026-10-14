export interface SkeletonProps {
  className?: string;
}

/** Bloque "shimmer" para estados de carga de contenido (listas, cards, detalle). */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden rounded-md bg-slate-200 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

/** Skeleton de una card de producto, para usar en grillas mientras carga el catalogo. */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3">
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}
