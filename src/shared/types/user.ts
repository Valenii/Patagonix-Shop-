/**
 * Roles soportados por la plataforma.
 * - customer: navega el catalogo, compra, ve su historial de ordenes.
 * - admin: gestiona catalogo y ordenes desde el panel protegido.
 */
export type UserRole = 'customer' | 'admin';

/** Documento de usuario persistido en Firestore (coleccion `users/{uid}`). */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  createdAt: number;
  updatedAt: number;
}

/** Datos minimos que expone el SDK de Firebase Auth, ya tipados para la app. */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
