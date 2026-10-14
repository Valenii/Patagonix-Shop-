import type { Product } from '@shared/types';
import { formatCurrency } from '@shared/utils/format';
import { Button } from '@shared/components/ui/Button';
import { EmptyState } from '@shared/components/feedback/EmptyState';

export interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

/** Tabla de productos (scroll horizontal en mobile). */
export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  if (products.length === 0) {
    return <EmptyState title="No hay productos cargados" description="Crea el primer producto del catalogo." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3">Categoria</th>
            <th className="px-4 py-3">Precio</th>
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product) => (
            <tr key={product.id}>
              <td className="flex items-center gap-3 px-4 py-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <span className="font-medium text-slate-800">{product.name}</span>
              </td>
              <td className="px-4 py-3 text-slate-600">{product.category}</td>
              <td className="px-4 py-3 text-slate-600">{formatCurrency(product.price)}</td>
              <td className="px-4 py-3">
                <span className={product.stock === 0 ? 'font-medium text-red-600' : 'text-slate-600'}>
                  {product.stock}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onEdit(product)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => onDelete(product)}>
                    Eliminar
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
