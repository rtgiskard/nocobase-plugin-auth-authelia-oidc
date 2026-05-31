import { DEFAULT_ISSUER, DEFAULT_SCOPE } from '../shared/constants';
import type { AutheliaOIDCOptions } from '../shared/types';

const DEFAULT_CLIENT_SECRET_ENV = 'NOCOBASE_AUTHELIA_OIDC_CLIENT_SECRET';

function requireString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeOptions(raw: unknown): AutheliaOIDCOptions {
  const options = isRecord(raw) ? raw : {};
  const issuer = optionalString(options.issuer) ?? DEFAULT_ISSUER;
  const clientId = requireString(options.clientId, 'clientId');
  const redirectUri = requireString(options.redirectUri, 'redirectUri');
  const scope = optionalString(options.scope) ?? DEFAULT_SCOPE;
  const clientSecretEnv = optionalString(options.clientSecretEnv) ?? DEFAULT_CLIENT_SECRET_ENV;
  const tokenEndpointAuthMethod = options.tokenEndpointAuthMethod === 'client_secret_basic' ? 'client_secret_basic' : 'client_secret_post';

  return {
    issuer,
    clientId,
    redirectUri,
    scope,
    clientSecretEnv,
    clientSecret: optionalString(options.clientSecret),
    autoSignUp: options.autoSignUp !== false,
    tokenEndpointAuthMethod,
    groupsRoleMap: isRecord(options.groupsRoleMap) ? Object.fromEntries(Object.entries(options.groupsRoleMap).filter(([, value]) => typeof value === 'string')) as Record<string, string> : undefined,
    defaultRole: optionalString(options.defaultRole),
  };
}

export function getClientSecret(options: AutheliaOIDCOptions): string {
  const secretFromEnv = options.clientSecretEnv ? optionalString(process.env[options.clientSecretEnv]) : undefined;
  const secret = secretFromEnv ?? options.clientSecret;
  if (!secret) {
    throw new Error(`OIDC client secret is required; set ${options.clientSecretEnv ?? DEFAULT_CLIENT_SECRET_ENV}`);
  }
  return secret;
}
