import { describe, expect, it } from 'vitest';
import { getClientSecret, normalizeOptions } from './options';

describe('normalizeOptions', () => {
  it('defaults to Authelia-safe OIDC settings', () => {
    const options = normalizeOptions({
      clientId: 'client-id',
      redirectUri: 'https://nocobase.example.com/api/authelia-oidc:redirect',
    });

    expect(options.issuer).toBe('https://auth.example.com');
    expect(options.scope).toBe('openid email profile groups');
    expect(options.autoSignUp).toBe(true);
    expect(options.tokenEndpointAuthMethod).toBe('client_secret_post');
  });

  it('requires clientId and redirectUri', () => {
    expect(() => normalizeOptions({ redirectUri: 'https://example.test/callback' })).toThrow('clientId is required');
    expect(() => normalizeOptions({ clientId: 'client-id' })).toThrow('redirectUri is required');
  });
});

describe('getClientSecret', () => {
  it('prefers the configured environment variable', () => {
    process.env.TEST_OIDC_SECRET = 'from-env';
    const secret = getClientSecret({
      issuer: 'https://auth.example.com',
      clientId: 'client-id',
      clientSecret: 'from-options',
      clientSecretEnv: 'TEST_OIDC_SECRET',
      redirectUri: 'https://nocobase.example.com/api/authelia-oidc:redirect',
      scope: 'openid',
      autoSignUp: true,
    });

    expect(secret).toBe('from-env');
    delete process.env.TEST_OIDC_SECRET;
  });
});
