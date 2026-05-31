const DEFAULT_REDIRECT = '/admin';

export function sanitizeRedirectTo(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) return DEFAULT_REDIRECT;
  if (!value.startsWith('/')) return DEFAULT_REDIRECT;
  if (value.startsWith('//')) return DEFAULT_REDIRECT;
  if (value.includes('\\')) return DEFAULT_REDIRECT;
  return value;
}

export function buildFrontendCallbackUrl(redirectTo: string, authenticator: string, token: string): string {
  const url = new URL(redirectTo, 'https://nocobase.local');
  url.searchParams.set('authenticator', authenticator);
  url.searchParams.set('token', token);
  return `${url.pathname}${url.search}${url.hash}`;
}
