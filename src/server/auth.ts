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

interface MutableUserProfile {
  get?(key: string): unknown;
  update(values: Record<string, string>): Promise<unknown>;
  [key: string]: unknown;
}

function userValue(user: MutableUserProfile, key: string): unknown {
  return typeof user.get === 'function' ? user.get(key) : user[key];
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

export function missingUserDataUpdates(user: MutableUserProfile, userData: ReturnType<typeof userDataFromClaims>): Record<string, string> {
  const updates: Record<string, string> = {};
  for (const key of ['email', 'nickname', 'username']) {
    const next = userData[key as keyof typeof userData];
    if (typeof next === 'string' && next.length > 0 && isBlank(userValue(user, key))) {
      updates[key] = next;
    }
  }
  return updates;
}

async function fillMissingUserData(user: MutableUserProfile, userData: ReturnType<typeof userDataFromClaims>): Promise<void> {
  const updates = missingUserDataUpdates(user, userData);
  if (Object.keys(updates).length > 0) await user.update(updates);
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
    const userData = userDataFromClaims(claims, options);

    if (options.autoSignUp === false) {
      const user = await authenticator.findUser(uuid);
      if (!user) throw new Error('User is not bound to this authenticator');
      await fillMissingUserData(user, userData);
      return user;
    }

    const user = await authenticator.findUser(uuid);
    if (user) {
      await fillMissingUserData(user, userData);
      return user;
    }

    return authenticator.newUser(uuid, userData);
  }
}
