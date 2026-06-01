import { AUTH_RESOURCE, CALLBACK_MARKER_PARAM, CALLBACK_MARKER_VALUE, EXCHANGE_ACTION } from '../shared/constants';
import { PENDING_FLOW_STORAGE_KEY } from './storage';

interface OidcAuthTarget {
  auth: {
    setAuthenticator(authenticator: string): void;
    setToken(token: string): void;
  };
  resource(resourceName: string): {
    [action: string]: (args: { values: { binding: string } }) => Promise<unknown>;
  };
}

interface CallbackLocation {
  hash: string;
  pathname: string;
  replace(url: string): void;
  search: string;
}

interface BrowserLike {
  location: CallbackLocation;
  history: {
    state: unknown;
    replaceState(data: unknown, unused: string, url?: string | URL | null): void;
  };
  sessionStorage: Storage;
}

interface PendingOidcFlow {
  binding: string;
  createdAt: number;
}

interface ExchangeResponse {
  authenticator: string;
  token: string;
}

const PENDING_FLOW_TTL_MS = 10 * 60 * 1000;

function parsePendingFlow(value: string | null): PendingOidcFlow | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    const binding = Reflect.get(parsed, 'binding');
    const createdAt = Reflect.get(parsed, 'createdAt');
    if (typeof binding !== 'string' || binding.length === 0) return null;
    if (typeof createdAt !== 'number' || !Number.isFinite(createdAt)) return null;
    return { binding, createdAt };
  } catch {
    return null;
  }
}

function cleanCallbackMarker(location: CallbackLocation): string {
  const searchParams = new URLSearchParams(location.search);
  searchParams.delete(CALLBACK_MARKER_PARAM);
  searchParams.delete('authenticator');
  searchParams.delete('token');
  const search = searchParams.toString();
  return `${location.pathname}${search ? `?${search}` : ''}${location.hash}`;
}

function isMarkedCallback(location: CallbackLocation): boolean {
  const marker = new URLSearchParams(location.search).get(CALLBACK_MARKER_PARAM);
  return marker === CALLBACK_MARKER_VALUE;
}

function exchangeDataFrom(result: unknown): ExchangeResponse | null {
  if (typeof result !== 'object' || result === null) return null;
  const root = result as { data?: { data?: { authenticator?: unknown; token?: unknown } } };
  const authenticator = root.data?.data?.authenticator;
  const token = root.data?.data?.token;
  if (typeof authenticator !== 'string' || authenticator.length === 0) return null;
  if (typeof token !== 'string' || token.length === 0) return null;
  return { authenticator, token };
}

export function readPendingOidcFlow(storage: Storage): PendingOidcFlow | null {
  return parsePendingFlow(storage.getItem(PENDING_FLOW_STORAGE_KEY));
}

export function removePendingOidcFlow(storage: Storage): void {
  storage.removeItem(PENDING_FLOW_STORAGE_KEY);
}

function isPendingFlowExpired(pending: PendingOidcFlow, now: number): boolean {
  return now - pending.createdAt >= PENDING_FLOW_TTL_MS;
}

export async function completeOidcCallbackInBrowser(apiClient: OidcAuthTarget, browser: BrowserLike, title: string) {
  if (!isMarkedCallback(browser.location)) return;

  const cleanedUrl = cleanCallbackMarker(browser.location);
  browser.history.replaceState(browser.history.state, title, cleanedUrl);

  const pending = readPendingOidcFlow(browser.sessionStorage);
  if (!pending) return;
  if (isPendingFlowExpired(pending, Date.now())) {
    removePendingOidcFlow(browser.sessionStorage);
    return;
  }

  try {
    const result = await apiClient.resource(AUTH_RESOURCE)[EXCHANGE_ACTION]({
      values: { binding: pending.binding },
    });
    const exchange = exchangeDataFrom(result);
    if (!exchange) throw new Error('OIDC exchange payload is invalid');
    apiClient.auth.setAuthenticator(exchange.authenticator);
    apiClient.auth.setToken(exchange.token);
    browser.location.replace(cleanedUrl);
  } finally {
    removePendingOidcFlow(browser.sessionStorage);
  }
}

export async function completeOidcCallback(apiClient: OidcAuthTarget) {
  if (typeof window === 'undefined') return;
  await completeOidcCallbackInBrowser(apiClient, window, document.title);
}
