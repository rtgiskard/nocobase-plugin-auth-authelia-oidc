import type { Cache } from '@nocobase/cache';
import type { Application } from '@nocobase/server';
import { createHash } from 'node:crypto';
import type { OIDCCallbackTicketPayload, OIDCStatePayload } from '../shared/types';

const STATE_TTL_MS = 10 * 60 * 1000;
const STATE_PREFIX = 'auth-oidc-external:state:';
const STATE_LOCK_TTL_MS = 5000;
const TICKET_TTL_MS = 120 * 1000;
const TICKET_PREFIX = 'auth-oidc-external:ticket:';
const TICKET_LOCK_TTL_MS = 5000;

function key(state: string): string {
  return `${STATE_PREFIX}${createHash('sha256').update(state).digest('hex')}`;
}

export async function saveOIDCState(cache: Cache, state: string, payload: OIDCStatePayload): Promise<void> {
  await cache.set(key(state), payload, STATE_TTL_MS);
}

async function consumeStoredState(cache: Cache, state: string): Promise<OIDCStatePayload> {
  const cacheKey = key(state);
  const stored = await cache.get<OIDCStatePayload>(cacheKey);
  await cache.del(cacheKey);
  if (!stored) throw new Error('OIDC state is invalid or expired');
  if (Date.now() - stored.createdAt > STATE_TTL_MS) throw new Error('OIDC state is expired');
  return stored;
}

export async function consumeOIDCState(app: Application, state: string): Promise<OIDCStatePayload> {
  return app.lockManager.runExclusive(key(state), () => consumeStoredState(app.cache, state), STATE_LOCK_TTL_MS);
}

function ticketKey(ticket: string): string {
  return `${TICKET_PREFIX}${createHash('sha256').update(ticket).digest('hex')}`;
}

export function sha256Base64Url(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}

export async function saveCallbackTicket(cache: Cache, ticket: string, payload: OIDCCallbackTicketPayload): Promise<void> {
  await cache.set(ticketKey(ticket), payload, TICKET_TTL_MS);
}

async function consumeStoredTicket(cache: Cache, ticket: string): Promise<OIDCCallbackTicketPayload> {
  const cacheKey = ticketKey(ticket);
  const stored = await cache.get<OIDCCallbackTicketPayload>(cacheKey);
  await cache.del(cacheKey);
  if (!stored) throw new Error('OIDC callback ticket is invalid or expired');
  if (Date.now() - stored.createdAt > TICKET_TTL_MS) throw new Error('OIDC callback ticket is expired');
  return stored;
}

export async function consumeCallbackTicket(app: Application, ticket: string): Promise<OIDCCallbackTicketPayload> {
  return app.lockManager.runExclusive(ticketKey(ticket), () => consumeStoredTicket(app.cache, ticket), TICKET_LOCK_TTL_MS);
}
