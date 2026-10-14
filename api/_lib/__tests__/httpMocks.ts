import { vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Mock minimo de VercelRequest, suficiente para los handlers de /api/s3/*. */
export function buildMockRequest(overrides: {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}): VercelRequest {
  return {
    method: overrides.method ?? 'POST',
    headers: overrides.headers ?? {},
    body: overrides.body,
  } as unknown as VercelRequest;
}

export interface MockResponse {
  statusCode: number;
  jsonBody: unknown;
  setHeader: ReturnType<typeof vi.fn>;
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
}

/** Mock de VercelResponse que registra el status code y el body enviado. */
export function buildMockResponse(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    jsonBody: undefined,
    setHeader: vi.fn(),
    status: vi.fn(),
    json: vi.fn(),
    end: vi.fn(),
  };
  res.status.mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json.mockImplementation((body: unknown) => {
    res.jsonBody = body;
    return res;
  });
  res.setHeader.mockReturnValue(res);
  res.end.mockReturnValue(res);
  return res;
}

export function asVercelResponse(mock: MockResponse): VercelResponse {
  return mock as unknown as VercelResponse;
}
