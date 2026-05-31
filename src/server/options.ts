import { DEFAULT_BUTTON_LABEL, DEFAULT_EMAIL_CLAIM, DEFAULT_ISSUER, DEFAULT_NICKNAME_CLAIM, DEFAULT_SCOPE, DEFAULT_USERNAME_CLAIM } from '../shared/constants';
import type { ExternalOIDCOptions } from '../shared/types';

const DEFAULT_CLIENT_SECRET_ENV = 'NOCOBASE_OIDC_CLIENT_SECRET';

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

export function normalizeOptions(raw: unknown): ExternalOIDCOptions {
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
    buttonLabel: optionalString(options.buttonLabel) ?? DEFAULT_BUTTON_LABEL,
    emailClaim: optionalString(options.emailClaim) ?? DEFAULT_EMAIL_CLAIM,
    nicknameClaim: optionalString(options.nicknameClaim) ?? DEFAULT_NICKNAME_CLAIM,
    tokenEndpointAuthMethod,
    usernameClaim: optionalString(options.usernameClaim) ?? DEFAULT_USERNAME_CLAIM,
  };
}

export function getClientSecret(options: ExternalOIDCOptions): string {
  const secretFromEnv = options.clientSecretEnv ? optionalString(process.env[options.clientSecretEnv]) : undefined;
  const secret = secretFromEnv ?? options.clientSecret;
  if (!secret) {
    throw new Error(`OIDC client secret is required; set ${options.clientSecretEnv ?? DEFAULT_CLIENT_SECRET_ENV}`);
  }
  return secret;
}
