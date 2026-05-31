import type { Context } from '@nocobase/actions';
import { describe, expect, it } from 'vitest';
import { AUTH_TYPE } from '../shared/constants';
import { getAuthenticator } from './resource';

describe('getAuthenticator', () => {
  it('only loads enabled OIDC authenticators', async () => {
    let requestedFilter: unknown;
    const ctx = {
      db: {
        getRepository: (name: string) => {
          expect(name).toBe('authenticators');
          return {
            findOne: async (query: unknown) => {
              requestedFilter = query;
              return {
                toJSON: () => ({ name: 'oidc', authType: AUTH_TYPE, enabled: true }),
              };
            },
          };
        },
      },
      throw: (status: number, message: string) => {
        throw new Error(`${status} ${message}`);
      },
    } as unknown as Context;

    await expect(getAuthenticator(ctx, 'oidc')).resolves.toMatchObject({ name: 'oidc', authType: AUTH_TYPE });
    expect(requestedFilter).toEqual({ filter: { name: 'oidc', enabled: true } });
  });

  it('rejects missing or disabled authenticators', async () => {
    const ctx = {
      db: {
        getRepository: (name: string) => {
          expect(name).toBe('authenticators');
          return {
            findOne: async () => null,
          };
        },
      },
      throw: (status: number, message: string) => {
        throw new Error(`${status} ${message}`);
      },
    } as unknown as Context;

    await expect(getAuthenticator(ctx, 'oidc')).rejects.toThrow('404 Authenticator is not found');
  });
});
