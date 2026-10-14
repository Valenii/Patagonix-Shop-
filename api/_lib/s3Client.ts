import { S3Client } from '@aws-sdk/client-s3';

/**
 * Cliente de S3 instanciado una sola vez por instancia de funcion serverless
 * (reuso entre invocaciones calientes). Las credenciales SOLO viven aca,
 * nunca llegan al bundle del frontend.
 */
let client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (client) return client;

  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Faltan variables de entorno de AWS (AWS_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY).',
    );
  }

  client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
  return client;
}

export function getBucketName(): string {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error('Falta la variable de entorno AWS_S3_BUCKET.');
  return bucket;
}

export function getPublicUrl(key: string): string {
  const customBase = process.env.S3_PUBLIC_BASE_URL;
  if (customBase) return `${customBase.replace(/\/$/, '')}/${key}`;
  const bucket = getBucketName();
  const region = process.env.AWS_REGION;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
