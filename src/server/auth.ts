import { BaseAuth, type AuthConfig } from '@nocobase/auth';
import type { AuthModel } from '@nocobase/plugin-auth';
import type { AutheliaOIDCOptions } from '../shared/types';

export class AutheliaOIDCAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  async validate() {
    const claims = this.ctx.state.autheliaOIDCClaims;
    if (!claims || typeof claims.sub !== 'string' || typeof claims.iss !== 'string') {
      throw new Error('OIDC claims are missing from request state');
    }

    const options = (this.authenticator?.options || {}) as AutheliaOIDCOptions;
    const authenticator = this.authenticator as AuthModel;
    const uuid = `${claims.iss}:${claims.sub}`;

    if (options.autoSignUp === false) {
      const user = await authenticator.findUser(uuid);
      if (!user) throw new Error('User is not bound to this authenticator');
      return user;
    }

    return authenticator.findOrCreateUser(uuid, {
      email: typeof claims.email === 'string' ? claims.email : undefined,
      nickname: typeof claims.name === 'string' ? claims.name : typeof claims.preferred_username === 'string' ? claims.preferred_username : undefined,
    });
  }
}
