import { CALLBACK_MARKER_PARAM, CALLBACK_MARKER_VALUE } from '../shared/constants';

const DEFAULT_REDIRECT = '/admin';
const SENSITIVE_REDIRECT_PARAMS = new Set([
  'token',
  'authenticator',
  'ticket',
  'code',
  'state',
  CALLBACK_MARKER_PARAM,
]);

export function sanitizeRedirectTo(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) return DEFAULT_REDIRECT;
  if (!value.startsWith('/')) return DEFAULT_REDIRECT;
  if (value.startsWith('//')) return DEFAULT_REDIRECT;
  if (value.includes('\\')) return DEFAULT_REDIRECT;
  return value;
}

export function buildFrontendCallbackUrl(redirectTo: string): string {
  const url = new URL(redirectTo, 'https://nocobase.local');
  for (const key of SENSITIVE_REDIRECT_PARAMS) {
    url.searchParams.delete(key);
  }
  url.searchParams.set(CALLBACK_MARKER_PARAM, CALLBACK_MARKER_VALUE);
  return `${url.pathname}${url.search}${url.hash}`;
}
