import type { Cache } from '@nocobase/cache';
import { createHash } from 'node:crypto';
import type { OIDCStatePayload } from '../shared/types';

const STATE_TTL_MS = 10 * 60 * 1000;
const STATE_PREFIX = 'auth-authelia-oidc:state:';

function key(state: string): string {
  return `${STATE_PREFIX}${createHash('sha256').update(state).digest('hex')}`;
}

export async function saveOIDCState(cache: Cache, state: string, payload: OIDCStatePayload): Promise<void> {
  await cache.set(key(state), payload, STATE_TTL_MS);
}

export async function consumeOIDCState(cache: Cache, state: string): Promise<OIDCStatePayload> {
  const stored = await cache.get<OIDCStatePayload>(key(state));
  await cache.del(key(state));
  if (!stored) throw new Error('OIDC state is invalid or expired');
  if (Date.now() - stored.createdAt > STATE_TTL_MS) throw new Error('OIDC state is expired');
  return stored;
}
