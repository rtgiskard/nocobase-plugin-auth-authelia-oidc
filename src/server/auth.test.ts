import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_BUTTON_HINT, DEFAULT_BUTTON_LABEL, DEFAULT_EMAIL_CLAIM, DEFAULT_ISSUER, DEFAULT_NICKNAME_CLAIM, DEFAULT_SCOPE, DEFAULT_USERNAME_CLAIM } from '../shared/constants';
import type { ExternalOIDCOptions } from '../shared/types';
import { ExternalOIDCAuth, userDataFromClaims } from './auth';

const options: ExternalOIDCOptions = {
  autoSignUp: true,
  buttonHint: DEFAULT_BUTTON_HINT,
  buttonLabel: DEFAULT_BUTTON_LABEL,
  clientId: 'client-id',
  clientSecretEnv: 'TEST_OIDC_SECRET',
  emailClaim: DEFAULT_EMAIL_CLAIM,
  issuer: DEFAULT_ISSUER,
  nicknameClaim: DEFAULT_NICKNAME_CLAIM,
  redirectUri: 'https://nocobase.example.com/api/oidc-external:redirect',
  scope: DEFAULT_SCOPE,
  usernameClaim: DEFAULT_USERNAME_CLAIM,
};

describe('userDataFromClaims', () => {
  it('uses Chinese display name as nickname', () => {
    expect(userDataFromClaims({
      iss: 'https://auth.example.com',
      sub: 'subject-id',
      name: '张三',
      preferred_username: 'zhangsan',
    }, options)).toMatchObject({
      nickname: '张三',
      username: 'zhangsan',
    });
  });

  it('uses valid preferred_username as username', () => {
    expect(userDataFromClaims({
      iss: 'https://auth.example.com',
      sub: 'subject-id',
      preferred_username: 'alice_01',
    }, options)).toMatchObject({
      nickname: 'alice_01',
      username: 'alice_01',
    });
  });

  it('does not write invalid preferred_username as username', () => {
    expect(userDataFromClaims({
      iss: 'https://auth.example.com',
      sub: 'subject-id',
      name: 'Alice Example',
      preferred_username: 'alice@example.com',
    }, options)).toEqual({
      email: undefined,
      nickname: 'Alice Example',
      username: undefined,
    });
  });

  it('does not derive username from email', () => {
    expect(userDataFromClaims({
      iss: 'https://auth.example.com',
      sub: 'subject-id',
      email: 'alice@example.com',
    }, options)).toEqual({
      email: 'alice@example.com',
      nickname: undefined,
      username: undefined,
    });
  });

  it('supports custom claim mapping', () => {
    expect(userDataFromClaims({
      iss: 'https://auth.example.com',
      sub: 'subject-id',
      mail: 'alice@example.com',
      display_name: 'Alice Display',
      user_name: 'alice',
    }, {
      ...options,
      emailClaim: 'mail',
      nicknameClaim: 'display_name',
      usernameClaim: 'user_name',
    })).toEqual({
      email: 'alice@example.com',
      nickname: 'Alice Display',
      username: 'alice',
    });
  });
});

describe('ExternalOIDCAuth.validate', () => {
  it('passes uuid and mapped user data to the authenticator', async () => {
    const findOrCreateUser = vi.fn(async () => ({ id: 1 }));
    const auth = Object.create(ExternalOIDCAuth.prototype) as ExternalOIDCAuth;

    Object.assign(auth, {
      authenticator: {
        options,
        findOrCreateUser,
      },
      ctx: {
        state: {
          externalOIDCClaims: {
            iss: 'https://auth.example.com',
            sub: 'subject-id',
            email: 'alice@example.com',
            name: '张三',
            preferred_username: 'zhangsan',
          },
        },
      },
    });

    await auth.validate();

    expect(findOrCreateUser).toHaveBeenCalledWith('https://auth.example.com:subject-id', {
      email: 'alice@example.com',
      nickname: '张三',
      username: 'zhangsan',
    });
  });

  it('normalizes authenticator options before mapping claims', async () => {
    const findOrCreateUser = vi.fn(async () => ({ id: 1 }));
    const auth = Object.create(ExternalOIDCAuth.prototype) as ExternalOIDCAuth;

    Object.assign(auth, {
      authenticator: {
        options: {
          clientId: 'client-id',
          redirectUri: 'https://nocobase.example.com/api/oidc-external:redirect',
        },
        findOrCreateUser,
      },
      ctx: {
        state: {
          externalOIDCClaims: {
            iss: 'https://auth.example.com',
            sub: 'subject-id',
            email: 'alice@example.com',
            name: 'Alice',
            preferred_username: 'alice',
          },
        },
      },
    });

    await auth.validate();

    expect(findOrCreateUser).toHaveBeenCalledWith('https://auth.example.com:subject-id', {
      email: 'alice@example.com',
      nickname: 'Alice',
      username: 'alice',
    });
  });
});
