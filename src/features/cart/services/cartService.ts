import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@shared/lib/firebase';
import type { CartItem } from '@shared/types';

const CARTS_COLLECTION = 'carts';

/** Lee el carrito persistido de un usuario. Devuelve [] si nunca guardo uno. */
export async function fetchCart(uid: string): Promise<CartItem[]> {
  const snapshot = await getDoc(doc(db, CARTS_COLLECTION, uid));
  if (!snapshot.exists()) return [];
  const data = snapshot.data();
  return Array.isArray(data.items) ? (data.items as CartItem[]) : [];
}

/** Sobrescribe el carrito persistido de un usuario (upsert). */
export async function saveCart(uid: string, items: CartItem[]): Promise<void> {
  await setDoc(
    doc(db, CARTS_COLLECTION, uid),
    { items, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
