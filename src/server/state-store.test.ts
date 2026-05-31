import { describe, expect, it } from 'vitest';
import type { Cache } from '@nocobase/cache';
import type { Application } from '@nocobase/server';
import { consumeOIDCState, saveOIDCState } from './state-store';

class MemoryCache {
  private values = new Map<string, unknown>();

  async set(key: string, value: unknown) {
    this.values.set(key, value);
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.values.get(key) as T | undefined;
  }

  async del(key: string) {
    this.values.delete(key);
  }
}

class SerialLockManager {
  private locks = new Map<string, Promise<void>>();

  async runExclusive<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(key) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.locks.set(key, previous.then(() => current));
    await previous;
    try {
      return await fn();
    } finally {
      release();
      if (this.locks.get(key) === current) this.locks.delete(key);
    }
  }
}

function app() {
  return {
    cache: new MemoryCache(),
    lockManager: new SerialLockManager(),
  } as unknown as Application;
}

describe('OIDC state store', () => {
  it('consumes saved state once', async () => {
    const testApp = app();
    await saveOIDCState(testApp.cache as Cache, 'state-value', {
      authenticator: 'oidc',
      codeVerifier: 'code-verifier',
      nonce: 'nonce',
      redirectTo: '/admin',
      createdAt: Date.now(),
    });

    await expect(consumeOIDCState(testApp, 'state-value')).resolves.toMatchObject({
      authenticator: 'oidc',
      nonce: 'nonce',
    });
    await expect(consumeOIDCState(testApp, 'state-value')).rejects.toThrow('OIDC state is invalid or expired');
  });

  it('serializes concurrent consumption of the same state', async () => {
    const testApp = app();
    await saveOIDCState(testApp.cache as Cache, 'state-value', {
      authenticator: 'oidc',
      codeVerifier: 'code-verifier',
      nonce: 'nonce',
      redirectTo: '/admin',
      createdAt: Date.now(),
    });

    const results = await Promise.allSettled([
      consumeOIDCState(testApp, 'state-value'),
      consumeOIDCState(testApp, 'state-value'),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
  });
});
