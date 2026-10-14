import { Link } from 'react-router-dom';
import { formatCurrency } from '@shared/utils/format';
import { RatingStars } from '@shared/components/ui/RatingStars';
import type { Product } from '@shared/types';

export function ProductCard({ product }: { product: Product }) {
  const isOutOfStock = product.stock <= 0;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-slate-300">📦</div>
        )}
        {isOutOfStock && (
          <span className="absolute left-2 top-2 rounded-full bg-slate-900/80 px-2 py-1 text-xs font-medium text-white">
            Sin stock
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-xs uppercase tracking-wide text-slate-400">{product.category}</span>
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-800">{product.name}</h3>
        <RatingStars value={product.ratingAverage} count={product.ratingCount} />
        <p className="mt-auto pt-1 text-base font-bold text-brand-700">{formatCurrency(product.price)}</p>
      </div>
    </Link>
  );
}
