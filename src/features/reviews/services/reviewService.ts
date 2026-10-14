import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@shared/lib/firebase';
import type { Result, Review, ReviewInput } from '@shared/types';

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  return Date.now();
}

function mapReview(snapshot: QueryDocumentSnapshot<DocumentData>, productId: string): Review {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    productId,
    userId: data.userId ?? '',
    userName: data.userName ?? 'Usuario',
    rating: data.rating ?? 5,
    comment: data.comment ?? '',
    createdAt: toMillis(data.createdAt),
  };
}

export async function fetchProductReviews(productId: string): Promise<Review[]> {
  const q = query(
    collection(db, 'products', productId, 'reviews'),
    orderBy('createdAt', 'desc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapReview(d, productId));
}

/**
 * Crea una review y recalcula el promedio del producto (ratingAverage/ratingCount)
 * en una transaccion para evitar condiciones de carrera entre reviews concurrentes.
 */
export async function createReview(
  productId: string,
  userId: string,
  userName: string,
  input: ReviewInput,
): Promise<Result<void>> {
  try {
    const productRef = doc(db, 'products', productId);
    const reviewRef = doc(collection(db, 'products', productId, 'reviews'));

    await runTransaction(db, async (transaction) => {
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists()) throw new Error('Producto no encontrado.');

      const currentCount = (productSnap.data().ratingCount as number) ?? 0;
      const currentAverage = (productSnap.data().ratingAverage as number) ?? 0;
      const newCount = currentCount + 1;
      const newAverage = (currentAverage * currentCount + input.rating) / newCount;

      transaction.set(reviewRef, {
        userId,
        userName,
        rating: input.rating,
        comment: input.comment,
        createdAt: serverTimestamp(),
      });

      transaction.update(productRef, {
        ratingCount: newCount,
        ratingAverage: Math.round(newAverage * 10) / 10,
      });
    });

    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: 'No se pudo publicar la review.' };
  }
}
