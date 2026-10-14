import { auth } from '@shared/lib/firebase';
import type { Result } from '@shared/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

async function getAuthHeader(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesion.');
  const idToken = await user.getIdToken();
  return `Bearer ${idToken}`;
}

/**
 * Flujo de upload seguro a S3 (ver docs/README):
 * 1. Pide una presigned URL a la Serverless Function (/api/s3/presign), que
 *    valida que el usuario sea admin antes de firmar.
 * 2. Sube el archivo DIRECTO a S3 con un PUT a esa URL (el archivo nunca
 *    pasa por nuestro backend, solo la firma).
 * 3. Devuelve la URL publica + la key (para poder borrarla despues).
 */
export async function uploadProductImage(file: File): Promise<Result<{ publicUrl: string; key: string }>> {
  try {
    const authHeader = await getAuthHeader();

    const presignResponse = await fetch(`${API_BASE}/api/s3/presign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
    });

    if (!presignResponse.ok) {
      const body = (await presignResponse.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: body.error ?? 'No se pudo preparar la subida de la imagen.' };
    }

    const { uploadUrl, publicUrl, key } = (await presignResponse.json()) as PresignResponse;

    const uploadResult = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!uploadResult.ok) {
      return { ok: false, error: 'No se pudo subir la imagen a S3.' };
    }

    return { ok: true, data: { publicUrl, key } };
  } catch {
    return { ok: false, error: 'Error de red al subir la imagen.' };
  }
}

export async function deleteProductImage(key: string): Promise<Result<void>> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE}/api/s3/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({ key }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: body.error ?? 'No se pudo borrar la imagen.' };
    }
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: 'Error de red al borrar la imagen.' };
  }
}
