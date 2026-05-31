import * as oidc from 'openid-client';
import type { AutheliaClaims, AutheliaOIDCOptions } from '../shared/types';
import { getClientSecret } from './options';

export interface AuthorizationRequest {
  url: URL;
  state: string;
  nonce: string;
  codeVerifier: string;
}

export interface CallbackResult {
  claims: AutheliaClaims;
}

function clientAuth(options: AutheliaOIDCOptions): oidc.ClientAuth {
  const secret = getClientSecret(options);
  return options.tokenEndpointAuthMethod === 'client_secret_basic'
    ? oidc.ClientSecretBasic(secret)
    : oidc.ClientSecretPost(secret);
}

async function configuration(options: AutheliaOIDCOptions): Promise<oidc.Configuration> {
  return oidc.discovery(
    new URL(options.issuer),
    options.clientId,
    {
      redirect_uris: [options.redirectUri],
      token_endpoint_auth_method: options.tokenEndpointAuthMethod ?? 'client_secret_post',
    },
    clientAuth(options),
  );
}

function stringClaim(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function stringArrayClaim(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0) : undefined;
}

function claimsFrom(value: Record<string, unknown>, issuer: string): AutheliaClaims {
  const sub = stringClaim(value.sub);
  if (!sub) throw new Error('OIDC subject claim is missing');
  return {
    iss: stringClaim(value.iss) ?? issuer,
    sub,
    email: stringClaim(value.email),
    name: stringClaim(value.name),
    preferred_username: stringClaim(value.preferred_username),
    groups: stringArrayClaim(value.groups),
  };
}

export async function buildAuthorizationRequest(options: AutheliaOIDCOptions): Promise<AuthorizationRequest> {
  const config = await configuration(options);
  const state = oidc.randomState();
  const nonce = oidc.randomNonce();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

  const url = oidc.buildAuthorizationUrl(config, {
    redirect_uri: options.redirectUri,
    scope: options.scope,
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return { url, state, nonce, codeVerifier };
}

export async function handleAuthorizationCallback(options: AutheliaOIDCOptions, currentUrl: URL, expected: { state: string; nonce: string; codeVerifier: string }): Promise<CallbackResult> {
  const config = await configuration(options);
  const tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
    expectedState: expected.state,
    expectedNonce: expected.nonce,
    pkceCodeVerifier: expected.codeVerifier,
    idTokenExpected: true,
  });

  const idTokenClaims = tokens.claims();
  if (!idTokenClaims?.sub) throw new Error('OIDC ID token subject is missing');
  if (typeof tokens.access_token !== 'string' || tokens.access_token.length === 0) {
    return { claims: claimsFrom(idTokenClaims, options.issuer) };
  }

  const userInfo = await oidc.fetchUserInfo(config, tokens.access_token, idTokenClaims.sub);
  return { claims: claimsFrom({ ...idTokenClaims, ...userInfo }, options.issuer) };
}
