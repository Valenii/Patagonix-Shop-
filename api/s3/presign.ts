import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { AuthError, requireAdminRole, verifyRequestToken } from '../_lib/firebaseAuth';
import { applyCors, handlePreflight, sendError } from '../_lib/http';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  getBucketName,
  getPublicUrl,
  getS3Client,
} from '../_lib/s3Client';

interface PresignBody {
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

/** Deja solo caracteres seguros para una key de S3, preservando la extension. */
function sanitizeFileName(fileName: string): string {
  const trimmed = fileName.trim().toLowerCase();
  const extMatch = /\.([a-z0-9]+)$/.exec(trimmed);
  const ext = extMatch ? extMatch[1] : 'jpg';
  const base = trimmed
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
  return `${base || 'imagen'}.${ext}`;
}

/**
 * POST /api/s3/presign
 * Genera una URL firmada (PUT) para que el panel de admin suba una imagen de
 * producto directo a S3, sin que las credenciales de AWS toquen el navegador.
 *
 * Body: { fileName, fileType, fileSize }
 * Header: Authorization: Bearer <Firebase ID token> (debe pertenecer a un admin)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  applyCors(req, res);

  if (req.method !== 'POST') {
    sendError(res, 405, 'Metodo no permitido. Usa POST.');
    return;
  }

  try {
    const user = await verifyRequestToken(req.headers.authorization);
    await requireAdminRole(user);

    const body = req.body as PresignBody;
    const { fileName, fileType, fileSize } = body ?? {};

    if (!fileName || !fileType || typeof fileSize !== 'number') {
      sendError(res, 400, 'Faltan campos: fileName, fileType, fileSize.');
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.has(fileType)) {
      sendError(res, 400, `Tipo de archivo no permitido: ${fileType}. Usa JPG, PNG o WEBP.`);
      return;
    }
    if (fileSize <= 0 || fileSize > MAX_IMAGE_SIZE_BYTES) {
      sendError(res, 400, `El archivo supera el limite de ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.`);
      return;
    }

    const key = `products/${randomUUID()}-${sanitizeFileName(fileName)}`;

    const command = new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      ContentType: fileType,
      ContentLength: fileSize,
    });

    const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 120 });

    res.status(200).json({ uploadUrl, publicUrl: getPublicUrl(key), key });
  } catch (error) {
    if (error instanceof AuthError) {
      sendError(res, error.status, error.message);
      return;
    }
    console.error('[api/s3/presign]', error);
    sendError(res, 500, 'No se pudo generar la URL de carga.');
  }
}
