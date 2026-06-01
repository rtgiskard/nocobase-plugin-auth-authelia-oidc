import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CALLBACK_MARKER_PARAM, CALLBACK_MARKER_VALUE } from '../shared/constants';
import { completeOidcCallbackInBrowser, readPendingOidcFlow } from './callback';
import { createClientBinding } from './flow-binding';
import { PENDING_FLOW_STORAGE_KEY } from './storage';

describe('callback helpers', () => {
  it('reads pending flow shape from storage', () => {
    const storage = new Map<string, string>();
    const sessionStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
    } as Storage;
    storage.set(PENDING_FLOW_STORAGE_KEY, JSON.stringify({ binding: 'binding-1', createdAt: 1 }));
    expect(readPendingOidcFlow(sessionStorage)).toEqual({ binding: 'binding-1', createdAt: 1 });
  });

  it('generates 256-bit base64url binding', () => {
    const bytes = new Uint8Array(32);
    bytes.fill(255);
    const binding = createClientBinding(bytes);
    expect(binding).toHaveLength(43);
    expect(binding).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('completeOidcCallback', () => {
  const setAuthenticator = vi.fn();
  const setToken = vi.fn();
  const exchange = vi.fn();
  const replace = vi.fn();
  const replaceState = vi.fn();
  const getItem = vi.fn();
  const removeItem = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('exchanges callback using binding, sets auth, and cleans marker', async () => {
    getItem.mockReturnValue(JSON.stringify({ binding: 'binding-1', createdAt: Date.now() }));
    exchange.mockResolvedValue({ data: { data: { authenticator: 'oidc', token: 'jwt-token' } } });

    await completeOidcCallbackInBrowser(
      {
        auth: { setAuthenticator, setToken },
        resource: () => ({ exchange }),
      },
      {
        location: {
          pathname: '/admin',
          replace,
          search: `?tab=users&${CALLBACK_MARKER_PARAM}=${CALLBACK_MARKER_VALUE}`,
          hash: '#a',
        },
        history: { replaceState, state: null },
        sessionStorage: {
          getItem,
          removeItem,
          setItem: vi.fn(),
          clear: vi.fn(),
          key: vi.fn(),
          length: 0,
        },
      },
      'title',
    );

    expect(replaceState).toHaveBeenCalledWith(null, 'title', '/admin?tab=users#a');
    expect(exchange).toHaveBeenCalledWith({ values: { binding: 'binding-1' } });
    expect(setAuthenticator).toHaveBeenCalledWith('oidc');
    expect(setToken).toHaveBeenCalledWith('jwt-token');
    expect(replace).toHaveBeenCalledWith('/admin?tab=users#a');
    expect(removeItem).toHaveBeenCalledWith(PENDING_FLOW_STORAGE_KEY);
  });

  it('removes expired pending flow without exchanging', async () => {
    const now = Date.now();
    getItem.mockReturnValue(JSON.stringify({ binding: 'binding-1', createdAt: now - (10 * 60 * 1000) - 1 }));

    await completeOidcCallbackInBrowser(
      {
        auth: { setAuthenticator, setToken },
        resource: () => ({ exchange }),
      },
      {
        location: {
          pathname: '/admin',
          replace,
          search: `?tab=users&${CALLBACK_MARKER_PARAM}=${CALLBACK_MARKER_VALUE}`,
          hash: '#a',
        },
        history: { replaceState, state: null },
        sessionStorage: {
          getItem,
          removeItem,
          setItem: vi.fn(),
          clear: vi.fn(),
          key: vi.fn(),
          length: 0,
        },
      },
      'title',
    );

    expect(replaceState).toHaveBeenCalledWith(null, 'title', '/admin?tab=users#a');
    expect(removeItem).toHaveBeenCalledWith(PENDING_FLOW_STORAGE_KEY);
    expect(exchange).not.toHaveBeenCalled();
    expect(setAuthenticator).not.toHaveBeenCalled();
    expect(setToken).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('does nothing when callback marker is absent', async () => {
    await completeOidcCallbackInBrowser(
      {
        auth: { setAuthenticator, setToken },
        resource: () => ({ exchange }),
      },
      {
        location: {
          pathname: '/admin',
          replace,
          search: '?tab=users',
          hash: '',
        },
        history: { replaceState, state: null },
        sessionStorage: {
          getItem,
          removeItem,
          setItem: vi.fn(),
          clear: vi.fn(),
          key: vi.fn(),
          length: 0,
        },
      },
      'title',
    );

    expect(exchange).not.toHaveBeenCalled();
    expect(setAuthenticator).not.toHaveBeenCalled();
    expect(setToken).not.toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});
