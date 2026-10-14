import type { Product } from '@shared/types';
import { ProductCardSkeleton } from '@shared/components/feedback/Skeleton';
import { EmptyState } from '@shared/components/feedback/EmptyState';
import { ProductCard } from './ProductCard';

export interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
}

/** Grilla responsiva (mobile-first: 2 columnas -> hasta 4 en desktop). */
export function ProductGrid({ products, isLoading }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title="No encontramos productos"
        description="Probá con otra categoría o con otro término de búsqueda."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
