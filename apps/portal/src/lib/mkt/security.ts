interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// TODO: Move to Upstash Redis or Vercel KV for Serverless production environments
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface MktRateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export const MKT_RATE_LIMITS: Record<string, MktRateLimitConfig> = {
  upload: { windowMs: 60_000, maxRequests: 10 },
  estrategias: { windowMs: 60_000, maxRequests: 30 },
  chat: { windowMs: 60_000, maxRequests: 20 },
  export: { windowMs: 60_000, maxRequests: 10 },
  generacao: { windowMs: 60_000, maxRequests: 5 },
};

export function checkRateLimit(
  key: string,
  config: MktRateLimitConfig,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

export function rateLimitHeaders(result: { remaining: number; resetAt: number }): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}

export function rateLimitResponse(result: { remaining: number; resetAt: number }): Response {
  return Response.json(
    {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        ...rateLimitHeaders(result),
        'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
      },
    },
  );
}

export const ALLOWED_UPLOAD_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const ALLOWED_UPLOAD_EXTENSIONS = ['.pdf', '.docx'];

export function validateMimeType(mimeType: string): boolean {
  return ALLOWED_UPLOAD_MIMES.includes(mimeType);
}

export function validateExtension(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return ALLOWED_UPLOAD_EXTENSIONS.includes(ext);
}

export function validateFileSize(sizeBytes: number, maxBytes: number = 20 * 1024 * 1024): boolean {
  return sizeBytes > 0 && sizeBytes <= maxBytes;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

export function validateUploadFile(
  filename: string,
  mimeType: string,
  sizeBytes: number,
): FileValidationResult {
  if (!validateExtension(filename)) {
    return {
      valid: false,
      error: `File type not allowed. Accepted: ${ALLOWED_UPLOAD_EXTENSIONS.join(', ')}`,
      code: 'INVALID_EXTENSION',
    };
  }

  if (!validateMimeType(mimeType)) {
    return {
      valid: false,
      error: `MIME type not allowed: ${mimeType}`,
      code: 'INVALID_MIME',
    };
  }

  if (!validateFileSize(sizeBytes)) {
    const maxMB = 20;
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxMB}MB`,
      code: 'FILE_TOO_LARGE',
    };
  }

  return { valid: true };
}

export function isMktRoute(pathname: string): boolean {
  return pathname.startsWith('/api/proxy/mkt/');
}

export function securityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'no-store',
  };
}

export function withSecurityHeaders(response: Response): Response {
  const headers = securityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export function resetRateLimitsForTests() {
  rateLimitStore.clear();
}
