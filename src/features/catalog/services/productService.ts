import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@shared/lib/firebase';
import type { Product, ProductCategory, ProductInput, Result } from '@shared/types';

const PRODUCTS_COLLECTION = 'products';
export const PRODUCTS_PAGE_SIZE = 8;

// TEMPORAL: los productos de ejemplo en Firestore todavia apuntan a loremflickr.com,
// que ya no sirve imagenes (401). Mientras no se corra `npm run seed` para corregir
// la base, se reemplazan por las de Unsplash (mismas que en scripts/seed-firestore.mjs).
// Borrar este bloque una vez actualizado `imageUrl` en Firestore.
const unsplash = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?w=600&h=600&fit=crop&fm=jpg`;

const FALLBACK_IMAGE_BY_NAME: Record<string, string> = {
  'Botas de trekking Andes Pro': unsplash('photo-1520219306100-ec4afeeefe58'),
  'Zapatillas trail Fitz Roy': unsplash('photo-1542291026-7eec264c27ff'),
  'Campera de pluma Torres': unsplash('photo-1591047139829-d91aecb6caea'),
  'Polar tecnico Lanin': unsplash('photo-1544923246-77307dd654cb'),
  'Mochila Cerro Catedral 45L': unsplash('photo-1622260614153-03223fb72052'),
  'Mochila de dia Nahuel 22L': unsplash('photo-1553062407-98eeb64c6a62'),
  'Carpa Patagonia 2P': unsplash('photo-1478131143081-80f7f84ca84d'),
  'Linterna frontal Glaciar 400': unsplash('photo-1517824806704-9040b037703b'),
};

function resolveImageUrl(name: string, imageUrl: string): string {
  if (imageUrl.includes('loremflickr.com')) return FALLBACK_IMAGE_BY_NAME[name] ?? '';
  return imageUrl;
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  return Date.now();
}

function mapProduct(snapshot: QueryDocumentSnapshot<DocumentData>): Product {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.name ?? '',
    description: data.description ?? '',
    price: data.price ?? 0,
    category: (data.category as ProductCategory) ?? 'accesorios',
    imageUrl: resolveImageUrl(data.name ?? '', data.imageUrl ?? ''),
    imageKey: data.imageKey ?? undefined,
    stock: data.stock ?? 0,
    ratingAverage: data.ratingAverage ?? 0,
    ratingCount: data.ratingCount ?? 0,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
    createdBy: data.createdBy ?? '',
  };
}

export interface ProductPage {
  products: Product[];
  /** Cursor para pedir la siguiente pagina (ver `startAfter` de Firestore). Null si no hay mas. */
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * Lista productos paginados (extra credit: `limit` + `startAfter`).
 * Si `category` es 'all' o undefined, no filtra por categoria.
 * La busqueda por nombre se hace client-side sobre cada pagina cargada
 * (Firestore no soporta full-text search nativo sin un servicio externo).
 */
export async function fetchProductsPage(options: {
  category?: ProductCategory | 'all';
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
}): Promise<ProductPage> {
  const { category, pageSize = PRODUCTS_PAGE_SIZE, cursor } = options;

  const constraints: QueryConstraint[] = [];
  if (category && category !== 'all') {
    constraints.push(where('category', '==', category));
  }
  constraints.push(orderBy('createdAt', 'desc'));
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(fsLimit(pageSize));

  const snapshot = await getDocs(query(collection(db, PRODUCTS_COLLECTION), ...constraints));
  const products = snapshot.docs.map(mapProduct);
  const lastDoc = snapshot.docs.at(-1) ?? null;

  return {
    products,
    cursor: lastDoc,
    hasMore: snapshot.docs.length === pageSize,
  };
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const snapshot = await getDoc(doc(db, PRODUCTS_COLLECTION, id));
  if (!snapshot.exists()) return null;
  return mapProduct(snapshot as QueryDocumentSnapshot<DocumentData>);
}

export async function createProduct(
  input: ProductInput,
  createdBy: string,
): Promise<Result<Product>> {
  try {
    const ref = doc(collection(db, PRODUCTS_COLLECTION));
    const payload = {
      ...input,
      ratingAverage: 0,
      ratingCount: 0,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, payload);
    const created = await getDoc(ref);
    return { ok: true, data: mapProduct(created as QueryDocumentSnapshot<DocumentData>) };
  } catch {
    return { ok: false, error: 'No se pudo crear el producto.' };
  }
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Result<void>> {
  try {
    await updateDoc(doc(db, PRODUCTS_COLLECTION, id), { ...input, updatedAt: serverTimestamp() });
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: 'No se pudo actualizar el producto.' };
  }
}

export async function deleteProduct(id: string): Promise<Result<void>> {
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: 'No se pudo eliminar el producto.' };
  }
}
