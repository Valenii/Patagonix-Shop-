import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useCart } from '@features/cart/hooks/useCart';
import { fetchProductReviews, createReview } from '@features/reviews/services/reviewService';
import { ReviewList } from '@features/reviews/components/ReviewList';
import { ReviewForm } from '@features/reviews/components/ReviewForm';
import { Button } from '@shared/components/ui/Button';
import { QuantitySelector } from '@shared/components/ui/QuantitySelector';
import { RatingStars } from '@shared/components/ui/RatingStars';
import { Spinner } from '@shared/components/feedback/Spinner';
import { ErrorMessage } from '@shared/components/feedback/ErrorMessage';
import { formatCurrency } from '@shared/utils/format';
import type { Product, Review } from '@shared/types';
import { fetchProductById } from '../services/productService';

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { profile, status } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    setIsLoading(true);

    Promise.all([fetchProductById(productId), fetchProductReviews(productId)])
      .then(([productData, reviewsData]) => {
        if (cancelled) return;
        if (!productData) {
          setError('Producto no encontrado.');
          return;
        }
        setProduct(productData);
        setReviews(reviewsData);
        setQuantity(1);
      })
      .catch(() => !cancelled && setError('No se pudo cargar el producto.'))
      .finally(() => !cancelled && setIsLoading(false));

    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return <ErrorMessage message={error ?? 'Producto no encontrado.'} />;
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleReviewSubmit = async (rating: 1 | 2 | 3 | 4 | 5, comment: string) => {
    if (!profile) return;
    const result = await createReview(product.id, profile.uid, profile.displayName, { rating, comment });
    if (result.ok) {
      const updated = await fetchProductReviews(product.id);
      setReviews(updated);
      const fresh = await fetchProductById(product.id);
      if (fresh) setProduct(fresh);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <Link to="/" className="text-sm text-brand-600 hover:underline">
        ← Volver al catalogo
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl text-slate-300">📦</div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs uppercase tracking-wide text-slate-400">{product.category}</span>
          <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
          <RatingStars value={product.ratingAverage} count={product.ratingCount} size="md" />
          <p className="text-3xl font-bold text-brand-700">{formatCurrency(product.price)}</p>
          <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>

          <p className="text-sm text-slate-500">
            {product.stock > 0 ? `${product.stock} unidades disponibles` : 'Sin stock disponible'}
          </p>

          {product.stock > 0 && (
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <QuantitySelector quantity={quantity} max={product.stock} onChange={setQuantity} />
              <Button onClick={handleAddToCart} size="lg">
                Agregar al carrito
              </Button>
            </div>
          )}
          {addedFeedback && (
            <p role="status" className="text-sm font-medium text-emerald-600">
              ✓ Agregado al carrito
            </p>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Reviews</h2>
        {status === 'authenticated' ? (
          <ReviewForm onSubmit={handleReviewSubmit} />
        ) : (
          <p className="text-sm text-slate-500">
            <button type="button" onClick={() => navigate('/login')} className="text-brand-600 hover:underline">
              Inicia sesion
            </button>{' '}
            para dejar una review.
          </p>
        )}
        <ReviewList reviews={reviews} />
      </section>
    </div>
  );
}
