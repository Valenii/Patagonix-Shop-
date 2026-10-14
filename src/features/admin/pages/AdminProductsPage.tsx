import { useEffect, useState } from 'react';
import { useAuth } from '@features/auth/hooks/useAuth';
import {
  createProduct,
  deleteProduct,
  fetchProductsPage,
  updateProduct,
} from '@features/catalog/services/productService';
import { deleteProductImage } from '../services/imageUploadService';
import type { Product, ProductInput } from '@shared/types';
import { Button } from '@shared/components/ui/Button';
import { Modal } from '@shared/components/ui/Modal';
import { Spinner } from '@shared/components/feedback/Spinner';
import { ErrorMessage } from '@shared/components/feedback/ErrorMessage';
import { ProductForm } from '../components/ProductForm';
import { ProductTable } from '../components/ProductTable';

const ADMIN_PAGE_SIZE = 50;

export function AdminProductsPage() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProducts = () => {
    setIsLoading(true);
    fetchProductsPage({ pageSize: ADMIN_PAGE_SIZE })
      .then((page) => setProducts(page.products))
      .catch(() => setError('No se pudieron cargar los productos.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(loadProducts, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSubmit = async (input: ProductInput) => {
    if (!profile) return;
    setIsSubmitting(true);

    // Si se reemplazo la imagen al editar, borramos la anterior de S3.
    if (editingProduct?.imageKey && editingProduct.imageKey !== input.imageKey) {
      void deleteProductImage(editingProduct.imageKey);
    }

    const result = editingProduct
      ? await updateProduct(editingProduct.id, input)
      : await createProduct(input, profile.uid);

    setIsSubmitting(false);

    if (result.ok) {
      setIsModalOpen(false);
      loadProducts();
    } else {
      setError(result.error);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Eliminar "${product.name}"? Esta accion no se puede deshacer.`)) return;

    setDeletingId(product.id);
    const result = await deleteProduct(product.id);
    if (result.ok && product.imageKey) {
      void deleteProductImage(product.imageKey);
    }
    setDeletingId(null);

    if (result.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Productos</h1>
        <Button onClick={openCreateModal}>+ Nuevo producto</Button>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadProducts} />}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
      ) : (
        <ProductTable
          products={products}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      )}

      {deletingId && (
        <p className="text-sm text-slate-500">
          <Spinner size="sm" /> Eliminando producto...
        </p>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Editar producto' : 'Nuevo producto'}
      >
        <ProductForm
          key={editingProduct?.id ?? 'new'}
          initialProduct={editingProduct ?? undefined}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </Modal>
    </div>
  );
}
