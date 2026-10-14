import type { CartItem } from './cart';

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'completed', 'cancelled'];

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
}

/** Documento de orden persistido en Firestore (coleccion `orders/{id}`). */
export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  /** Numero de seguimiento simulado, generado al crear la orden. */
  trackingNumber: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateOrderInput {
  userId: string;
  userEmail: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
}

export interface OrderFilters {
  status?: OrderStatus | 'all';
}
