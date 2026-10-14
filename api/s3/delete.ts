import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { AuthError, requireAdminRole, verifyRequestToken } from '../_lib/firebaseAuth';
import { applyCors, handlePreflight, sendError } from '../_lib/http';
import { getBucketName, getS3Client } from '../_lib/s3Client';

interface DeleteBody {
  key?: string;
}

/**
 * POST /api/s3/delete
 * Borra una imagen de producto de S3. Solo admins. La key debe vivir bajo
 * `products/` para evitar que el endpoint se use para borrar objetos arbitrarios.
 *
 * Body: { key }
 * Header: Authorization: Bearer <Firebase ID token>
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

    const { key } = (req.body as DeleteBody) ?? {};

    if (!key || typeof key !== 'string' || !key.startsWith('products/')) {
      sendError(res, 400, 'Key invalida. Debe empezar con "products/".');
      return;
    }

    await getS3Client().send(new DeleteObjectCommand({ Bucket: getBucketName(), Key: key }));

    res.status(200).json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      sendError(res, error.status, error.message);
      return;
    }
    console.error('[api/s3/delete]', error);
    sendError(res, 500, 'No se pudo borrar la imagen.');
  }
}
