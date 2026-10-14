import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { useDebounce } from '@shared/hooks/useDebounce';
import type { Product, ProductCategory } from '@shared/types';
import { fetchProductsPage, PRODUCTS_PAGE_SIZE } from '../services/productService';

interface UseProductsOptions {
  category?: ProductCategory | 'all';
  search?: string;
}

interface UseProductsResult {
  products: Product[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
}

/**
 * Carga productos paginados desde Firestore, filtrando por categoria server-side
 * y por nombre client-side (con debounce) sobre las paginas ya traidas.
 */
export function useProducts({ category = 'all', search = '' }: UseProductsOptions): UseProductsResult {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  // Reinicia la paginacion cuando cambia la categoria.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchProductsPage({ category, pageSize: PRODUCTS_PAGE_SIZE })
      .then((page) => {
        if (cancelled) return;
        setAllProducts(page.products);
        setCursor(page.cursor);
        setHasMore(page.hasMore);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudieron cargar los productos.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    fetchProductsPage({ category, pageSize: PRODUCTS_PAGE_SIZE, cursor })
      .then((page) => {
        setAllProducts((prev) => [...prev, ...page.products]);
        setCursor(page.cursor);
        setHasMore(page.hasMore);
      })
      .catch(() => setError('No se pudieron cargar mas productos.'))
      .finally(() => setIsLoadingMore(false));
  }, [category, cursor, hasMore, isLoadingMore]);

  const products = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return allProducts;
    return allProducts.filter((product) => product.name.toLowerCase().includes(term));
  }, [allProducts, debouncedSearch]);

  return { products, isLoading, isLoadingMore, error, hasMore, loadMore };
}
