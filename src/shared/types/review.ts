/** Documento de review persistido en Firestore (coleccion `products/{productId}/reviews/{id}`). */
export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createdAt: number;
}

export interface ReviewInput {
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
}
