import type { Context, Next } from '@nocobase/actions';
import type { Application } from '@nocobase/server';
import { AUTH_TYPE, DEFAULT_AUTHENTICATOR } from '../shared/constants';
import { buildAuthorizationRequest, handleAuthorizationCallback } from './oidc';
import { normalizeOptions } from './options';
import { buildFrontendCallbackUrl, sanitizeRedirectTo } from './redirect';
import { consumeOIDCState, saveOIDCState } from './state-store';

interface AuthenticatorRecord {
  name: string;
  authType: string;
  options?: unknown;
}

interface AuthResponse {
  token: string;
}

function actionValues(ctx: Context): Record<string, unknown> {
  const values = ctx.action?.params?.values;
  return typeof values === 'object' && values !== null && !Array.isArray(values) ? values : {};
}

function queryValue(ctx: Context, name: string): string | undefined {
  const value = ctx.query[name];
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  return typeof value === 'string' ? value : undefined;
}

function callbackUrlFrom(ctx: Context, redirectUri: string): URL {
  const url = new URL(redirectUri);
  url.search = ctx.querystring;
  return url;
}

async function getAuthenticator(ctx: Context, name: string): Promise<AuthenticatorRecord> {
  const authenticator = await ctx.db.getRepository('authenticators').findOne({ filter: { name } });
  if (!authenticator) ctx.throw(404, 'Authenticator is not found');
  const record = authenticator.toJSON() as AuthenticatorRecord;
  if (record.authType !== AUTH_TYPE) ctx.throw(400, 'Authenticator type is invalid');
  return record;
}

export function registerActions(app: Application, resourceName: string) {
  app.resourceManager.define({
    name: resourceName,
    actions: {
      async getAuthUrl(ctx: Context, next: Next) {
        const values = actionValues(ctx);
        const authenticatorName = typeof values.authenticator === 'string' && values.authenticator.length > 0 ? values.authenticator : DEFAULT_AUTHENTICATOR;
        const authenticator = await getAuthenticator(ctx, authenticatorName);
        const options = normalizeOptions(authenticator.options);
        const redirectTo = sanitizeRedirectTo(values.redirectTo);
        const request = await buildAuthorizationRequest(options);

        await saveOIDCState(ctx.app.cache, request.state, {
          authenticator: authenticatorName,
          codeVerifier: request.codeVerifier,
          nonce: request.nonce,
          redirectTo,
          createdAt: Date.now(),
        });

        ctx.body = { data: { url: request.url.toString() } };
        await next();
      },
      async redirect(ctx: Context, next: Next) {
        const state = queryValue(ctx, 'state');
        if (!state) ctx.throw(400, 'OIDC state is missing');

        const stored = await consumeOIDCState(ctx.app.cache, state);
        const authenticator = await getAuthenticator(ctx, stored.authenticator);
        const options = normalizeOptions(authenticator.options);
        const callbackUrl = callbackUrlFrom(ctx, options.redirectUri);
        const result = await handleAuthorizationCallback(options, callbackUrl, {
          state,
          nonce: stored.nonce,
          codeVerifier: stored.codeVerifier,
        });

        ctx.state.autheliaOIDCClaims = result.claims;
        ctx.auth = await ctx.app.authManager.get(stored.authenticator, ctx);
        const authResponse = await ctx.auth.signIn() as AuthResponse;
        ctx.redirect(buildFrontendCallbackUrl(stored.redirectTo, stored.authenticator, authResponse.token));
        await next();
      },
    },
  });
}
