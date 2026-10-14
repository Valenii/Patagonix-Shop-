import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * Verificacion de Firebase ID tokens SIN requerir una service account.
 *
 * Por que este enfoque: las Vercel Serverless Functions no tienen por que cargar
 * el Admin SDK completo (que exige credenciales de service account) solo para
 * validar un JWT. Los ID tokens de Firebase son JWT RS256 estandar, firmados con
 * claves publicadas por Google en un JWKS publico. Verificando firma + claims
 * (iss/aud/exp) a mano evitamos un secreto de infraestructura adicional,
 * coherente con el enfoque BaaS del proyecto (menos credenciales que rotar).
 *
 * Para resolver el ROL del usuario (admin/customer) no confiamos en el token
 * (no tiene custom claims en este proyecto): se consulta el doc `users/{uid}`
 * via la Firestore REST API reenviando el mismo ID token como Bearer, de forma
 * que la verificacion de acceso la hacen las propias Firestore Security Rules.
 */

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID;

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks() {
  jwks ??= createRemoteJWKSet(new URL(JWKS_URL));
  return jwks;
}

export interface VerifiedUser {
  uid: string;
  email: string | null;
  /** Se conserva para poder reenviarlo a la Firestore REST API al chequear el rol. */
  idToken: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Extrae y valida el Bearer token del header Authorization. Lanza AuthError si falla. */
export async function verifyRequestToken(authorizationHeader: string | undefined): Promise<VerifiedUser> {
  if (!FIREBASE_PROJECT_ID) {
    throw new AuthError('El servidor no tiene configurado FIREBASE_PROJECT_ID.', 500);
  }
  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new AuthError('Falta el header Authorization: Bearer <idToken>.', 401);
  }

  const idToken = authorizationHeader.slice('Bearer '.length).trim();
  if (!idToken) {
    throw new AuthError('Token vacio.', 401);
  }

  try {
    const { payload } = await jwtVerify(idToken, getJwks(), {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });

    const uid = typeof payload.sub === 'string' ? payload.sub : null;
    if (!uid) throw new AuthError('Token invalido: falta subject.', 401);

    return { uid, email: typeof payload.email === 'string' ? payload.email : null, idToken };
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError('Token invalido o expirado.', 401);
  }
}

/**
 * Confirma que el usuario tiene rol `admin` leyendo su doc de Firestore
 * via REST, autenticado con su propio ID token (las Security Rules exigen
 * que un usuario solo pueda leer su propio documento).
 */
export async function requireAdminRole(user: VerifiedUser): Promise<void> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${user.uid}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${user.idToken}` },
  });

  if (!response.ok) {
    throw new AuthError('No se pudo verificar el rol del usuario.', 403);
  }

  const doc = (await response.json()) as { fields?: { role?: { stringValue?: string } } };
  const role = doc.fields?.role?.stringValue;

  if (role !== 'admin') {
    throw new AuthError('Esta accion requiere rol de administrador.', 403);
  }
}
