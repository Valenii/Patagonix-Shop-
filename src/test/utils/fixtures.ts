import type { CartItem, Product, UserProfile } from '@shared/types';

export function buildUserProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    uid: 'user-1',
    email: 'cliente@patagonix.test',
    displayName: 'Cliente de Prueba',
    role: 'customer',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

export function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'product-1',
    name: 'Campera impermeable',
    description: 'Campera outdoor resistente al agua, ideal para trekking en la Patagonia.',
    price: 45000,
    category: 'indumentaria',
    imageUrl: 'https://example-bucket.s3.amazonaws.com/products/campera.jpg',
    imageKey: 'products/campera.jpg',
    stock: 10,
    ratingAverage: 4.5,
    ratingCount: 2,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'admin-1',
    ...overrides,
  };
}

export function buildCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: 'product-1',
    name: 'Campera impermeable',
    price: 45000,
    imageUrl: 'https://example-bucket.s3.amazonaws.com/products/campera.jpg',
    quantity: 1,
    maxStock: 10,
    ...overrides,
  };
}
