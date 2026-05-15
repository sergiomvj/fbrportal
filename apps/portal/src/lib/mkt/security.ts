export interface MktRateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface MktRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  source: 'supabase';
  unavailable?: boolean;
}

export const MKT_RATE_LIMITS: Record<string, MktRateLimitConfig> = {
  upload: { windowMs: 60_000, maxRequests: 10 },
  estrategias: { windowMs: 60_000, maxRequests: 30 },
  chat: { windowMs: 60_000, maxRequests: 10 },
  export: { windowMs: 60_000, maxRequests: 10 },
  generacao: { windowMs: 60_000, maxRequests: 5 },
};

export async function checkPersistentRateLimit(
  key: string,
  config: MktRateLimitConfig,
): Promise<MktRateLimitResult> {
  try {
    const { createSupabaseServerClient } = await import('@/lib/supabase-admin');
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .rpc('mkt_consume_rate_limit', {
        p_key: key,
        p_limit: config.maxRequests,
        p_window_ms: config.windowMs,
      })
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Rate limit RPC returned no data.');

    const row = data as { allowed: boolean; remaining: number; reset_at_ms: number };
    return {
      allowed: row.allowed,
      remaining: row.remaining,
      resetAt: row.reset_at_ms,
      source: 'supabase',
    };
  } catch {
    return {
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + config.windowMs,
      source: 'supabase',
      unavailable: true,
    };
  }
}

export function rateLimitHeaders(result: { remaining: number; resetAt: number }): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}

export function rateLimitResponse(result: { remaining: number; resetAt: number; unavailable?: boolean }): Response {
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
  if (result.unavailable) {
    return Response.json(
      {
        code: 'RATE_LIMIT_UNAVAILABLE',
        message: 'Rate limit infrastructure is unavailable. Please try again later.',
        retryAfter,
      },
      {
        status: 503,
        headers: {
          ...rateLimitHeaders(result),
          'Retry-After': String(retryAfter),
        },
      },
    );
  }

  return Response.json(
    {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        ...rateLimitHeaders(result),
        'Retry-After': String(retryAfter),
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
  // Rate limits are persisted through Supabase; kept for test compatibility.
}
