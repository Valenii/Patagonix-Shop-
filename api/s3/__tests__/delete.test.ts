import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMockRequest, buildMockResponse, asVercelResponse } from '../../_lib/__tests__/httpMocks';

// --- Mock del AWS SDK real ---------------------------------------------------
const sendMock = vi.fn();

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class MockS3Client {
    send = sendMock;
  },
  DeleteObjectCommand: class MockDeleteObjectCommand {
    constructor(public input: unknown) {}
  },
}));

// --- Mock de la verificacion de Firebase ------------------------------------
const verifyRequestTokenMock = vi.fn();
const requireAdminRoleMock = vi.fn();

class MockAuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

vi.mock('../../_lib/firebaseAuth', () => ({
  AuthError: MockAuthError,
  verifyRequestToken: (...args: unknown[]) => verifyRequestTokenMock(...args),
  requireAdminRole: (...args: unknown[]) => requireAdminRoleMock(...args),
}));

vi.stubEnv('AWS_REGION', 'sa-east-1');
vi.stubEnv('AWS_S3_BUCKET', 'patagonix-test-bucket');
vi.stubEnv('S3_ACCESS_KEY_ID', 'fake-access-key');
vi.stubEnv('S3_SECRET_ACCESS_KEY', 'fake-secret-key');

const { default: handler } = await import('../delete');

describe('POST /api/s3/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyRequestTokenMock.mockResolvedValue({ uid: 'admin-1', email: 'admin@test.com', idToken: 'fake-token' });
    requireAdminRoleMock.mockResolvedValue(undefined);
    sendMock.mockResolvedValue({});
  });

  it('rechaza una key que no empiece con "products/" (evita borrar objetos arbitrarios)', async () => {
    const req = buildMockRequest({
      headers: { authorization: 'Bearer admin-token' },
      body: { key: '../etc/passwd' },
    });
    const res = buildMockResponse();

    await handler(req, asVercelResponse(res));

    expect(res.statusCode).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('devuelve 403 si el usuario no es admin', async () => {
    requireAdminRoleMock.mockRejectedValue(new MockAuthError('Requiere rol admin.', 403));
    const req = buildMockRequest({
      headers: { authorization: 'Bearer customer-token' },
      body: { key: 'products/foo.jpg' },
    });
    const res = buildMockResponse();

    await handler(req, asVercelResponse(res));

    expect(res.statusCode).toBe(403);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('borra el objeto de S3 cuando la key es valida y el usuario es admin', async () => {
    const req = buildMockRequest({
      headers: { authorization: 'Bearer admin-token' },
      body: { key: 'products/abc-foto.jpg' },
    });
    const res = buildMockResponse();

    await handler(req, asVercelResponse(res));

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({ ok: true });
  });
});
