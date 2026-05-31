import { BaseAuth, type AuthConfig } from '@nocobase/auth';
import type { AuthModel } from '@nocobase/plugin-auth';
import type { ExternalOIDCOptions, OIDCClaims } from '../shared/types';
import { normalizeOptions } from './options';

const USERNAME_PATTERN = /^[^@<>"'/]{1,50}$/;

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function claimString(claims: OIDCClaims, name: string): string | undefined {
  return optionalString(claims[name]);
}

export function usernameFromClaims(claims: OIDCClaims, options: ExternalOIDCOptions): string | undefined {
  const username = claimString(claims, options.usernameClaim);
  return username && USERNAME_PATTERN.test(username) ? username : undefined;
}

export function userDataFromClaims(claims: OIDCClaims, options: ExternalOIDCOptions) {
  const username = usernameFromClaims(claims, options);
  return {
    email: claimString(claims, options.emailClaim),
    nickname: claimString(claims, options.nicknameClaim) ?? username,
    username,
  };
}

export class ExternalOIDCAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  async validate() {
    const claims = this.ctx.state.externalOIDCClaims;
    if (!claims || typeof claims.sub !== 'string' || typeof claims.iss !== 'string') {
      throw new Error('OIDC claims are missing from request state');
    }

    const options = normalizeOptions(this.authenticator?.options);
    const authenticator = this.authenticator as AuthModel;
    const uuid = `${claims.iss}:${claims.sub}`;

    if (options.autoSignUp === false) {
      const user = await authenticator.findUser(uuid);
      if (!user) throw new Error('User is not bound to this authenticator');
      return user;
    }

    return authenticator.findOrCreateUser(uuid, userDataFromClaims(claims, options));
  }
}
