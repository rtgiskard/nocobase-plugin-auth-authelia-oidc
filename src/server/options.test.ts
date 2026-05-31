import { describe, expect, it } from 'vitest';
import { getClientSecret, normalizeOptions } from './options';

describe('normalizeOptions', () => {
  it('defaults to generic OIDC settings with Authelia-compatible claims', () => {
    const options = normalizeOptions({
      clientId: 'client-id',
      redirectUri: 'https://nocobase.example.com/api/oidc-external:redirect',
    });

    expect(options.issuer).toBe('https://auth.example.com');
    expect(options.scope).toBe('openid email profile groups');
    expect(options.autoSignUp).toBe(true);
    expect(options.buttonHint).toBe('Click to continue through your organization identity provider.');
    expect(options.buttonLabel).toBe('Sign in with OIDC');
    expect(options.emailClaim).toBe('email');
    expect(options.nicknameClaim).toBe('name');
    expect(options.tokenEndpointAuthMethod).toBe('client_secret_post');
    expect(options.usernameClaim).toBe('preferred_username');
  });

  it('supports custom claim mapping and button label', () => {
    const options = normalizeOptions({
      buttonHint: 'Click to continue with Example IdP',
      buttonLabel: 'Sign in with Example IdP',
      clientId: 'client-id',
      emailClaim: 'mail',
      nicknameClaim: 'display_name',
      redirectUri: 'https://nocobase.example.com/api/oidc-external:redirect',
      usernameClaim: 'user_name',
    });

    expect(options.buttonHint).toBe('Click to continue with Example IdP');
    expect(options.buttonLabel).toBe('Sign in with Example IdP');
    expect(options.emailClaim).toBe('mail');
    expect(options.nicknameClaim).toBe('display_name');
    expect(options.usernameClaim).toBe('user_name');
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
      redirectUri: 'https://nocobase.example.com/api/oidc-external:redirect',
      scope: 'openid',
      autoSignUp: true,
      buttonHint: 'Click to continue through your organization identity provider.',
      buttonLabel: 'Sign in with OIDC',
      emailClaim: 'email',
      nicknameClaim: 'name',
      usernameClaim: 'preferred_username',
    });

    expect(secret).toBe('from-env');
    delete process.env.TEST_OIDC_SECRET;
  });
});
