import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { db } from '@shared/lib/firebase';
import { generateTrackingNumber } from '@shared/utils/format';
import type { CartItem, CreateOrderInput, Order, OrderStatus, Result } from '@shared/types';

const ORDERS_COLLECTION = 'orders';
const PRODUCTS_COLLECTION = 'products';
const SHIPPING_COST = 0; // envio simulado sin costo para simplificar el checkout de prueba

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  return Date.now();
}

function mapOrder(snapshot: QueryDocumentSnapshot<DocumentData>): Order {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    userId: data.userId ?? '',
    userEmail: data.userEmail ?? '',
    items: data.items ?? [],
    subtotal: data.subtotal ?? 0,
    shippingCost: data.shippingCost ?? 0,
    total: data.total ?? 0,
    status: (data.status as OrderStatus) ?? 'pending',
    shippingAddress: data.shippingAddress,
    trackingNumber: data.trackingNumber ?? '',
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

/** Error de negocio que se muestra tal cual al usuario (ej: sin stock). */
class CheckoutError extends Error {}

/**
 * Crea la orden (status inicial `pending`) y descuenta stock en UNA transaccion:
 * o se guardan la orden y todos los descuentos, o no se guarda nada.
 *
 * El nombre y el precio de cada item se leen del producto en Firestore en este
 * momento (snapshot al momento de la compra), no del carrito, que pudo quedar
 * desactualizado desde que se agrego el producto.
 */
export async function createOrder(input: CreateOrderInput): Promise<Result<Order>> {
  try {
    const ref = doc(collection(db, ORDERS_COLLECTION));

    await runTransaction(db, async (transaction) => {
      // En una transaccion todas las lecturas deben ir antes que las escrituras.
      const lines = await Promise.all(
        input.items.map(async (item) => {
          const ref = doc(db, PRODUCTS_COLLECTION, item.productId);
          return { item, ref, snap: await transaction.get(ref) };
        }),
      );

      const items: CartItem[] = lines.map(({ item, snap }) => {
        if (!snap.exists()) {
          throw new CheckoutError(`"${item.name}" ya no esta disponible.`);
        }
        const data = snap.data();
        const stock = (data.stock as number) ?? 0;
        if (stock < item.quantity) {
          throw new CheckoutError(`No hay stock suficiente de "${data.name ?? item.name}" (quedan ${stock}).`);
        }
        return {
          ...item,
          name: (data.name as string) ?? item.name,
          price: (data.price as number) ?? item.price,
          maxStock: stock,
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      transaction.set(ref, {
        userId: input.userId,
        userEmail: input.userEmail,
        items,
        subtotal,
        shippingCost: SHIPPING_COST,
        total: subtotal + SHIPPING_COST,
        status: 'pending' as OrderStatus,
        shippingAddress: input.shippingAddress,
        trackingNumber: generateTrackingNumber(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      lines.forEach(({ ref: productRef }, index) => {
        const item = items[index] as CartItem;
        transaction.update(productRef, {
          stock: item.maxStock - item.quantity,
          updatedAt: serverTimestamp(),
        });
      });
    });

    const created = await getDoc(ref);
    return { ok: true, data: mapOrder(created as QueryDocumentSnapshot<DocumentData>) };
  } catch (error) {
    if (error instanceof CheckoutError) return { ok: false, error: error.message };
    console.error('[createOrder] Error al crear la orden:', error);
    if (error instanceof FirebaseError && error.code === 'permission-denied') {
      return { ok: false, error: 'No tenes permisos para crear la orden. Revisa las reglas de Firestore.' };
    }
    return { ok: false, error: 'No se pudo crear la orden. Intenta nuevamente.' };
  }
}

export async function fetchOrdersByUser(userId: string): Promise<Order[]> {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapOrder);
}

export async function fetchOrderById(id: string): Promise<Order | null> {
  const snapshot = await getDoc(doc(db, ORDERS_COLLECTION, id));
  if (!snapshot.exists()) return null;
  return mapOrder(snapshot as QueryDocumentSnapshot<DocumentData>);
}

/** Lista todas las ordenes (panel admin), opcionalmente filtradas por estado. */
export async function fetchAllOrders(status?: OrderStatus | 'all'): Promise<Order[]> {
  const constraints: QueryConstraint[] = [];
  if (status && status !== 'all') constraints.push(where('status', '==', status));
  constraints.push(orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(query(collection(db, ORDERS_COLLECTION), ...constraints));
  return snapshot.docs.map(mapOrder);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Result<void>> {
  try {
    await updateDoc(doc(db, ORDERS_COLLECTION, id), { status, updatedAt: serverTimestamp() });
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: 'No se pudo actualizar el estado de la orden.' };
  }
}
