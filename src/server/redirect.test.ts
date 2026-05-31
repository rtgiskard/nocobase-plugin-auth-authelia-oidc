import { describe, expect, it } from 'vitest';
import { buildFrontendCallbackUrl, sanitizeRedirectTo } from './redirect';

describe('sanitizeRedirectTo', () => {
  it('keeps local relative paths', () => {
    expect(sanitizeRedirectTo('/admin')).toBe('/admin');
    expect(sanitizeRedirectTo('/admin?tab=users#top')).toBe('/admin?tab=users#top');
  });

  it('rejects external and protocol-relative redirects', () => {
    expect(sanitizeRedirectTo('https://evil.test/callback')).toBe('/admin');
    expect(sanitizeRedirectTo('//evil.test/callback')).toBe('/admin');
    expect(sanitizeRedirectTo('javascript:alert(1)')).toBe('/admin');
  });

  it('rejects backslash redirects', () => {
    expect(sanitizeRedirectTo('/\\evil.test')).toBe('/admin');
  });
});

describe('buildFrontendCallbackUrl', () => {
  it('adds authenticator and token to local callback URL', () => {
    expect(buildFrontendCallbackUrl('/admin?tab=users', 'authelia', 'token-value')).toBe('/admin?tab=users&authenticator=authelia&token=token-value');
  });
});
