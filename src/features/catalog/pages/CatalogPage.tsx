import { useState } from 'react';
import type { ProductCategory } from '@shared/types';
import { Button } from '@shared/components/ui/Button';
import { ErrorMessage } from '@shared/components/feedback/ErrorMessage';
import { useProducts } from '../hooks/useProducts';
import { ProductGrid } from '../components/ProductGrid';
import { CategoryFilter } from '../components/CategoryFilter';
import { SearchBar } from '../components/SearchBar';

export function CatalogPage() {
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  const { products, isLoading, isLoadingMore, error, hasMore, loadMore } = useProducts({
    category,
    search,
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Equipamiento outdoor</h1>
        <p className="text-sm text-slate-500">
          Todo lo que necesitas para tu proxima travesia en la Patagonia.
        </p>
      </div>

      <SearchBar value={search} onChange={setSearch} />
      <CategoryFilter value={category} onChange={setCategory} />

      {error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          <ProductGrid products={products} isLoading={isLoading} />
          {!isLoading && hasMore && !search && (
            <div className="flex justify-center pt-2">
              <Button variant="secondary" onClick={loadMore} isLoading={isLoadingMore}>
                Cargar mas productos
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
