export type ProductCategory =
  | 'calzado'
  | 'indumentaria'
  | 'mochilas'
  | 'campamento'
  | 'accesorios';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'calzado',
  'indumentaria',
  'mochilas',
  'campamento',
  'accesorios',
];

/** Documento de producto persistido en Firestore (coleccion `products/{id}`). */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  imageUrl: string;
  /** Clave del objeto en S3, usada para poder borrarlo al eliminar/editar el producto. */
  imageKey?: string;
  stock: number;
  /** Promedio de calificaciones (0 si aun no tiene reviews). Desnormalizado para listados rapidos. */
  ratingAverage: number;
  ratingCount: number;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

/** Payload para crear/editar un producto desde el panel de admin. */
export interface ProductInput {
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  imageUrl: string;
  imageKey?: string;
  stock: number;
}

export interface ProductFilters {
  category?: ProductCategory | 'all';
  search?: string;
}
