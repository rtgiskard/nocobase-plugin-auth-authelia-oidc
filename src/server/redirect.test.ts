import { describe, expect, it } from 'vitest';
import { CALLBACK_MARKER_PARAM, CALLBACK_MARKER_VALUE } from '../shared/constants';
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
  it('adds only non-secret callback marker to local callback URL', () => {
    expect(buildFrontendCallbackUrl('/admin?tab=users')).toBe(`/admin?tab=users&${CALLBACK_MARKER_PARAM}=${CALLBACK_MARKER_VALUE}`);
  });

  it('strips sensitive callback query params before marker is added', () => {
    expect(buildFrontendCallbackUrl('/admin?token=x&authenticator=y&code=c&state=s&ticket=t&keep=1')).toBe(
      `/admin?keep=1&${CALLBACK_MARKER_PARAM}=${CALLBACK_MARKER_VALUE}`,
    );
  });
});
