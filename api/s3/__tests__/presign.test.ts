import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMockRequest, buildMockResponse, asVercelResponse } from '../../_lib/__tests__/httpMocks';

// --- Mock del AWS SDK real: ningun test llama a AWS. -----------------------
const getSignedUrlMock = vi.fn();

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => getSignedUrlMock(...args),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class MockS3Client {
    constructor(public config: unknown) {}
  },
  PutObjectCommand: class MockPutObjectCommand {
    constructor(public input: unknown) {}
  },
}));

// --- Mock de la verificacion de Firebase: se testea por separado. ----------
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

const { default: handler } = await import('../presign');

describe('POST /api/s3/presign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyRequestTokenMock.mockResolvedValue({ uid: 'admin-1', email: 'admin@test.com', idToken: 'fake-token' });
    requireAdminRoleMock.mockResolvedValue(undefined);
    getSignedUrlMock.mockResolvedValue('https://s3.mock/signed-url');
  });

  it('rechaza metodos distintos de POST', async () => {
    const req = buildMockRequest({ method: 'GET' });
    const res = buildMockResponse();

    await handler(req, asVercelResponse(res));

    expect(res.statusCode).toBe(405);
  });

  it('devuelve 401 si no hay header Authorization', async () => {
    verifyRequestTokenMock.mockRejectedValue(new MockAuthError('Falta el header Authorization.', 401));
    const req = buildMockRequest({ body: { fileName: 'foto.jpg', fileType: 'image/jpeg', fileSize: 1000 } });
    const res = buildMockResponse();

    await handler(req, asVercelResponse(res));

    expect(res.statusCode).toBe(401);
    expect(getSignedUrlMock).not.toHaveBeenCalled();
  });

  it('devuelve 403 si el usuario autenticado no es admin', async () => {
    requireAdminRoleMock.mockRejectedValue(new MockAuthError('Requiere rol admin.', 403));
    const req = buildMockRequest({
      headers: { authorization: 'Bearer token-de-customer' },
      body: { fileName: 'foto.jpg', fileType: 'image/jpeg', fileSize: 1000 },
    });
    const res = buildMockResponse();

    await handler(req, asVercelResponse(res));

    expect(res.statusCode).toBe(403);
    expect(getSignedUrlMock).not.toHaveBeenCalled();
  });

  it('rechaza tipos de archivo no permitidos', async () => {
    const req = buildMockRequest({
      headers: { authorization: 'Bearer admin-token' },
      body: { fileName: 'virus.exe', fileType: 'application/x-msdownload', fileSize: 1000 },
    });
    const res = buildMockResponse();

    await handler(req, asVercelResponse(res));

    expect(res.statusCode).toBe(400);
    expect(getSignedUrlMock).not.toHaveBeenCalled();
  });

  it('rechaza archivos que superan el limite de tamano', async () => {
    const req = buildMockRequest({
      headers: { authorization: 'Bearer admin-token' },
      body: { fileName: 'foto.jpg', fileType: 'image/jpeg', fileSize: 10 * 1024 * 1024 },
    });
    const res = buildMockResponse();

    await handler(req, asVercelResponse(res));

    expect(res.statusCode).toBe(400);
  });

  it('genera una presigned URL para un admin con un archivo valido', async () => {
    const req = buildMockRequest({
      headers: { authorization: 'Bearer admin-token' },
      body: { fileName: 'Campera Roja.jpg', fileType: 'image/jpeg', fileSize: 2048 },
    });
    const res = buildMockResponse();

    await handler(req, asVercelResponse(res));

    expect(res.statusCode).toBe(200);
    expect(getSignedUrlMock).toHaveBeenCalledTimes(1);

    const body = res.jsonBody as { uploadUrl: string; publicUrl: string; key: string };
    expect(body.uploadUrl).toBe('https://s3.mock/signed-url');
    expect(body.key).toMatch(/^products\/.+-campera-roja\.jpg$/);
    expect(body.publicUrl).toContain('patagonix-test-bucket');
  });
});
