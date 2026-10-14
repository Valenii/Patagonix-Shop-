import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Headers CORS compartidos por todas las funciones de /api. */
export function applyCors(req: VercelRequest, res: VercelResponse): void {
  const origin = req.headers.origin;
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
}

/** Maneja el preflight OPTIONS. Devuelve true si ya respondio (el caller debe `return`). */
export function handlePreflight(req: VercelRequest, res: VercelResponse): boolean {
  applyCors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

export function sendError(res: VercelResponse, status: number, message: string): void {
  res.status(status).json({ error: message });
}
