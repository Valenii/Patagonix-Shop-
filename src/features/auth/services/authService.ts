import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '@shared/lib/firebase';
import type { LoginInput, RegisterInput, Result, UserProfile, UserRole } from '@shared/types';

const USERS_COLLECTION = 'users';

/** Traduce codigos de error de Firebase Auth a mensajes legibles para el usuario final. */
function translateAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'Ese email ya esta registrado.',
    'auth/invalid-email': 'El email ingresado no es valido.',
    'auth/weak-password': 'La contrasena debe tener al menos 6 caracteres.',
    'auth/user-not-found': 'No existe una cuenta con ese email.',
    'auth/wrong-password': 'Email o contrasena incorrectos.',
    'auth/invalid-credential': 'Email o contrasena incorrectos.',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta mas tarde.',
    'auth/popup-closed-by-user': 'Se cerro la ventana de Google antes de completar el login.',
    'auth/network-request-failed': 'Error de red. Revisa tu conexion.',
  };
  return map[code] ?? 'Ocurrio un error inesperado. Intenta nuevamente.';
}

function resolveInitialRole(email: string): UserRole {
  const bootstrapEmail = import.meta.env.VITE_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  if (bootstrapEmail && bootstrapEmail === email.trim().toLowerCase()) return 'admin';
  return 'customer';
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  return Date.now();
}

/** Crea (o recupera si ya existe) el documento de perfil en Firestore para un usuario de Auth. */
async function ensureUserProfile(
  firebaseUser: FirebaseUser,
  displayNameFallback?: string,
): Promise<UserProfile> {
  const ref = doc(db, USERS_COLLECTION, firebaseUser.uid);
  const snapshot = await getDoc(ref);

  if (snapshot.exists()) {
    const data = snapshot.data();
    return {
      uid: firebaseUser.uid,
      email: data.email ?? firebaseUser.email ?? '',
      displayName: data.displayName ?? firebaseUser.displayName ?? '',
      role: (data.role as UserRole) ?? 'customer',
      photoURL: data.photoURL ?? firebaseUser.photoURL ?? undefined,
      createdAt: toMillis(data.createdAt),
      updatedAt: toMillis(data.updatedAt),
    };
  }

  const email = firebaseUser.email ?? '';
  const displayName = firebaseUser.displayName ?? displayNameFallback ?? email.split('@')[0] ?? 'Usuario';
  const role = resolveInitialRole(email);

  const profile = {
    email,
    displayName,
    role,
    photoURL: firebaseUser.photoURL ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, profile);

  return {
    uid: firebaseUser.uid,
    email,
    displayName,
    role,
    photoURL: firebaseUser.photoURL ?? undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    uid,
    email: data.email ?? '',
    displayName: data.displayName ?? '',
    role: (data.role as UserRole) ?? 'customer',
    photoURL: data.photoURL ?? undefined,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

export async function registerWithEmail(input: RegisterInput): Promise<Result<UserProfile>> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
    await updateProfile(credential.user, { displayName: input.displayName });
    const profile = await ensureUserProfile(credential.user, input.displayName);
    return { ok: true, data: profile };
  } catch (error) {
    return { ok: false, error: translateAuthError(error) };
  }
}

export async function loginWithEmail(input: LoginInput): Promise<Result<UserProfile>> {
  try {
    const credential = await signInWithEmailAndPassword(auth, input.email, input.password);
    const profile = await ensureUserProfile(credential.user);
    return { ok: true, data: profile };
  } catch (error) {
    return { ok: false, error: translateAuthError(error) };
  }
}

export async function loginWithGoogle(): Promise<Result<UserProfile>> {
  try {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    const profile = await ensureUserProfile(credential.user);
    return { ok: true, data: profile };
  } catch (error) {
    return { ok: false, error: translateAuthError(error) };
  }
}

export async function logout(): Promise<Result<void>> {
  try {
    await signOut(auth);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: translateAuthError(error) };
  }
}

/** Suscribe a cambios de sesion. Devuelve el profile completo (o null) ya resuelto desde Firestore. */
export function subscribeToAuthChanges(
  callback: (profile: UserProfile | null) => void,
): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }
    try {
      const profile = await ensureUserProfile(firebaseUser);
      callback(profile);
    } catch {
      callback(null);
    }
  });
}
