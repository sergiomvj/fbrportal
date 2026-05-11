const SIGNED_URL_TTL_SECONDS = 3600;

export interface MktStorageUploadResult {
  path: string;
  sizeBytes: number;
  mimeType: string;
  originalName: string;
}

export interface MktSignedDownload {
  url: string;
  expiresAt: string;
}

export function buildStoragePath(
  empresaId: string,
  estrategiaId: string,
  filename: string,
): string {
  const sanitized = sanitizeFilename(filename);
  return `mkt/${empresaId}/${estrategiaId}/${sanitized}`;
}

export function buildExportPath(
  empresaId: string,
  estrategiaId: string,
  formato: 'pdf' | 'pptx',
): string {
  const ts = Date.now();
  return `mkt-exports/${empresaId}/${estrategiaId}/${ts}.${formato}`;
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 200);
}

export function getMimeType(filename: string): string | null {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  return mimeMap[ext ?? ''] ?? null;
}

export function isAllowedMimeType(mimeType: string): boolean {
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];
  return allowed.includes(mimeType);
}

export function isAllowedExtension(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop();
  return ['pdf', 'docx', 'doc'].includes(ext ?? '');
}

export const MKT_MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export function validateUploadSize(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MKT_MAX_UPLOAD_BYTES;
}

export function createSignedDownload(
  _storagePath: string,
): MktSignedDownload {
  const expiresAt = new Date(
    Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
  ).toISOString();
  return {
    url: `/api/proxy/mkt/download?path=${encodeURIComponent(_storagePath)}&expires=${expiresAt}`,
    expiresAt,
  };
}

export function isSignedUrlExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}

export const MKT_STORAGE_BUCKETS = {
  uploads: 'mkt-uploads',
  exports: 'mkt-exports',
} as const;
