import { beforeEach, describe, expect, it, vi } from 'vitest';

const jwtVerifyMock = vi.fn();

vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => 'mock-jwks'),
  jwtVerify: (...args: unknown[]) => jwtVerifyMock(...args),
}));

vi.stubEnv('FIREBASE_PROJECT_ID', 'patagonix-shop-test');

const { verifyRequestToken, requireAdminRole, AuthError } = await import('../firebaseAuth');

describe('verifyRequestToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rechaza si no hay header Authorization', async () => {
    await expect(verifyRequestToken(undefined)).rejects.toThrow(AuthError);
  });

  it('rechaza si el header no tiene el formato "Bearer <token>"', async () => {
    await expect(verifyRequestToken('Token abc')).rejects.toThrow(AuthError);
  });

  it('rechaza si jose.jwtVerify lanza (firma invalida o token expirado)', async () => {
    jwtVerifyMock.mockRejectedValue(new Error('signature verification failed'));

    await expect(verifyRequestToken('Bearer token-invalido')).rejects.toThrow(AuthError);
  });

  it('devuelve uid/email cuando el token es valido', async () => {
    jwtVerifyMock.mockResolvedValue({
      payload: { sub: 'user-123', email: 'cliente@patagonix.test' },
    });

    const result = await verifyRequestToken('Bearer token-valido');

    expect(result).toEqual({ uid: 'user-123', email: 'cliente@patagonix.test', idToken: 'token-valido' });
  });
});

describe('requireAdminRole', () => {
  const user = { uid: 'user-123', email: 'cliente@patagonix.test', idToken: 'token-valido' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('lanza 403 si el usuario no tiene rol admin', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ fields: { role: { stringValue: 'customer' } } }),
    } as Response);

    await expect(requireAdminRole(user)).rejects.toThrow(AuthError);
  });

  it('resuelve sin error si el usuario tiene rol admin', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ fields: { role: { stringValue: 'admin' } } }),
    } as Response);

    await expect(requireAdminRole(user)).resolves.toBeUndefined();
  });

  it('lanza 403 si la consulta a Firestore REST falla (ej: reglas de seguridad)', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

    await expect(requireAdminRole(user)).rejects.toThrow(AuthError);
  });
});
