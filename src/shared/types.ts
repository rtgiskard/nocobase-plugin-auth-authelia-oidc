export interface AutheliaOIDCOptions {
  issuer: string;
  clientId: string;
  clientSecretEnv?: string;
  clientSecret?: string;
  redirectUri: string;
  scope: string;
  autoSignUp: boolean;
  tokenEndpointAuthMethod?: 'client_secret_post' | 'client_secret_basic';
  groupsRoleMap?: Record<string, string>;
  defaultRole?: string;
}

export interface OIDCStatePayload {
  authenticator: string;
  codeVerifier: string;
  nonce: string;
  redirectTo: string;
  createdAt: number;
}

export interface AutheliaClaims {
  iss: string;
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  groups?: string[];
}
