import { describe, expect, it, vi } from 'vitest';
import { createAndStorePendingOidcFlow } from './flow-binding';
import { postSignInRedirectFrom } from './redirect-target';
import { PENDING_FLOW_STORAGE_KEY } from './storage';

describe('createAndStorePendingOidcFlow', () => {
  it('stores a pending flow with generated binding and createdAt', () => {
    const setItem = vi.fn();
    const storage = { setItem } as unknown as Storage;
    const getRandomValues = vi.fn((bytes: Uint8Array) => {
      bytes.fill(1);
      return bytes;
    });

    vi.stubGlobal('crypto', { getRandomValues });
    const pending = createAndStorePendingOidcFlow(storage);

    expect(pending.binding).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(pending.createdAt).toBeTypeOf('number');
    expect(setItem).toHaveBeenCalledWith(PENDING_FLOW_STORAGE_KEY, JSON.stringify(pending));
  });
});

describe('postSignInRedirectFrom', () => {
  it('uses the sign-in redirect query as the post-login target', () => {
    expect(postSignInRedirectFrom({ pathname: '/signin', search: '?redirect=%2Fadmin%3Ftab%3Dusers', hash: '' })).toBe(
      '/admin?tab=users',
    );
  });

  it('falls back to admin when the sign-in redirect query is empty', () => {
    expect(postSignInRedirectFrom({ pathname: '/signin', search: '?redirect=', hash: '' })).toBe('/admin');
  });

  it('keeps the current route outside the sign-in page', () => {
    expect(postSignInRedirectFrom({ pathname: '/admin', search: '?tab=users', hash: '#top' })).toBe('/admin?tab=users#top');
  });
});
