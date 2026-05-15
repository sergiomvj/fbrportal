import { headers } from 'next/headers';

/**
 * Constrói a URL absoluta para chamadas internas (self-proxy) 
 * detectando automaticamente o host e a porta atual.
 */
export async function getInternalApiUrl(path: string): Promise<string> {
  const host = (await headers()).get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  
  // Garante que o path comece com /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${protocol}://${host}${normalizedPath}`;
}
