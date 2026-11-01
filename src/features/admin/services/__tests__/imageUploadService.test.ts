import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock de Firebase Auth: el "usuario logueado" es un objeto falso que devuelve
// un ID token fijo. Ningun test llama a Firebase real.
const getIdTokenMock = vi.fn();
const authMock: { currentUser: { getIdToken: () => Promise<string> } | null } = {
  currentUser: { getIdToken: () => getIdTokenMock() },
};

vi.mock('@shared/lib/firebase', () => ({ auth: authMock }));

// Mock de la red: ni la Serverless Function ni S3 se llaman de verdad.
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const { uploadProductImage, deleteProductImage } = await import('../imageUploadService');

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const file = new File(['fake-image'], 'campera.jpg', { type: 'image/jpeg' });

describe('imageUploadService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.currentUser = { getIdToken: () => getIdTokenMock() };
    getIdTokenMock.mockResolvedValue('firebase-id-token');
  });

  it('pide la presigned URL con el token y sube el archivo directo a S3', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, {
          uploadUrl: 'https://bucket.s3.amazonaws.com/products/abc?X-Amz-Signature=1',
          publicUrl: 'https://bucket.s3.amazonaws.com/products/abc',
          key: 'products/abc',
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const result = await uploadProductImage(file);

    expect(result).toEqual({
      ok: true,
      data: { publicUrl: 'https://bucket.s3.amazonaws.com/products/abc', key: 'products/abc' },
    });

    // 1) Pedido a nuestra funcion, con el Firebase ID token y SIN credenciales de AWS.
    const [presignUrl, presignInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(presignUrl).toBe('/api/s3/presign');
    expect((presignInit.headers as Record<string, string>).Authorization).toBe('Bearer firebase-id-token');
    expect(JSON.parse(presignInit.body as string)).toEqual({
      fileName: 'campera.jpg',
      fileType: 'image/jpeg',
      fileSize: file.size,
    });

    // 2) PUT directo a la URL firmada de S3, sin header Authorization.
    const [uploadUrl, uploadInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(uploadUrl).toContain('X-Amz-Signature');
    expect(uploadInit.method).toBe('PUT');
    expect(uploadInit.headers).toEqual({ 'Content-Type': 'image/jpeg' });
    expect(uploadInit.body).toBe(file);
  });

  it('no llama a la API si no hay usuario logueado', async () => {
    authMock.currentUser = null;

    const result = await uploadProductImage(file);

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('muestra el error de la funcion cuando el usuario no es admin (403)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(403, { error: 'Esta accion requiere rol de administrador.' }));

    const result = await uploadProductImage(file);

    expect(result).toEqual({ ok: false, error: 'Esta accion requiere rol de administrador.' });
    expect(fetchMock).toHaveBeenCalledTimes(1); // nunca intenta subir a S3
  });

  it('avisa si la API no esta disponible (npm run dev sin vercel dev)', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Not Found', { status: 404 }));

    const result = await uploadProductImage(file);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('vercel dev');
  });

  it('devuelve error si S3 rechaza la subida', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { uploadUrl: 'https://s3/signed', publicUrl: 'https://s3/x', key: 'products/x' }))
      .mockResolvedValueOnce(new Response(null, { status: 403 }));

    const result = await uploadProductImage(file);

    expect(result).toEqual({ ok: false, error: 'No se pudo subir la imagen a S3.' });
  });

  it('pide el borrado de una imagen a /api/s3/delete con el token', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const result = await deleteProductImage('products/abc');

    expect(result.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/s3/delete');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer firebase-id-token');
    expect(JSON.parse(init.body as string)).toEqual({ key: 'products/abc' });
  });
});
