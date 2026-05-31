# @gskd/plugin-auth-authelia-oidc

Authelia OIDC authentication plugin for NocoBase 2.0.60.

This plugin is intentionally scoped to a specific Authelia deployment. It is not a generic OIDC plugin and it does not replace NocoBase's official Professional Edition OIDC plugin.

## Security Goals

- Use Authorization Code Flow with PKCE and nonce.
- Use random, single-use state values generated with `crypto.randomBytes`.
- Bind users by immutable `issuer + sub`, not email.
- Never log tokens, authorization codes, state values, nonces, or client secrets.
- Keep client secrets in Kubernetes Secret-backed environment variables whenever possible.
- Validate post-login redirects against local relative paths only.
- Do not disable TLS verification in production.

## Implemented Flow

```text
SignInButton
  -> /api/authelia-oidc:getAuthUrl
  -> Authelia authorization endpoint
  -> /api/authelia-oidc:redirect
  -> state + nonce + PKCE validation
  -> token exchange
  -> userinfo fetch with expected sub
  -> NocoBase user binding via issuer + sub
  -> NocoBase JWT sign-in
  -> local frontend redirect with authenticator + token
```

The callback only redirects to local relative paths. External redirect targets are ignored to prevent token leakage.

## Authenticator Options

Create a NocoBase authenticator with `authType = authelia-oidc` and options like:

```json
{
  "issuer": "https://auth.example.com",
  "clientId": "<client-id>",
  "clientSecretEnv": "NOCOBASE_AUTHELIA_OIDC_CLIENT_SECRET",
  "redirectUri": "https://nocobase.example.com/api/authelia-oidc:redirect",
  "scope": "openid email profile groups",
  "autoSignUp": true,
  "tokenEndpointAuthMethod": "client_secret_post"
}
```

`clientSecret` is supported for disposable test environments, but production should use `clientSecretEnv`.

## NocoBase Integration

Build and copy the packaged plugin into:

```text
/app/nocobase/storage/plugins/@gskd/plugin-auth-authelia-oidc/
```

Enable it inside the NocoBase container:

```bash
yarn pm enable @gskd/plugin-auth-authelia-oidc
```

For the current Kubernetes deployment, use an initContainer to copy the plugin artifact into the NocoBase PVC before the main container starts.

Example initContainer payload:

```yaml
initContainers:
  - name: install-auth-authelia-oidc-plugin
    image: registry.example.com/library/nocobase-plugin-auth-authelia-oidc:v0.1.0
    command:
      - /bin/sh
      - -c
      - |
        rm -rf /app/nocobase/storage/plugins/@gskd/plugin-auth-authelia-oidc
        mkdir -p /app/nocobase/storage/plugins/@gskd
        cp -a /plugin/@gskd/plugin-auth-authelia-oidc /app/nocobase/storage/plugins/@gskd/
    volumeMounts:
      - name: nocobase-data
        mountPath: /app/nocobase/storage
```

Inject the client secret into the NocoBase pod:

```yaml
env:
  - name: NOCOBASE_AUTHELIA_OIDC_CLIENT_SECRET
    valueFrom:
      secretKeyRef:
        name: nocobase-oidc-client-secret
        key: client-secret
```

## Authelia Client

Use a dedicated OIDC client:

```yaml
- client_name: nocobase
  client_id: <random-client-id>
  client_secret:
    path: /secrets/nocobase-oidc-client-secret/client-secret.hash
  authorization_policy: one_factor
  require_pkce: true
  pkce_challenge_method: S256
  token_endpoint_auth_method: client_secret_post
  claims_policy: nocobase
  redirect_uris:
    - https://nocobase.example.com/api/authelia-oidc:redirect
  scopes:
    - openid
    - email
    - profile
    - groups
```

## Development

```bash
npm install
npm run check
npm run lint:security
npm run build
```

Build the artifact image:

```bash
docker build -t registry.example.com/library/nocobase-plugin-auth-authelia-oidc:v0.1.0 .
```

## Hardening TODO

- Add explicit Authelia group to NocoBase role mapping after confirming the target NocoBase role schema in production.
- Add integration tests against a local Authelia test provider.
- Add a post-renderer patch in the k0s repo to install this plugin from an artifact image.
