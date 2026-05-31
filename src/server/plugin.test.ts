import { describe, expect, it } from 'vitest';
import { AUTH_RESOURCE, CALLBACK_ACTION, GET_AUTH_URL_ACTION } from '../shared/constants';
import { allowPublicOIDCActions } from './plugin';

describe('allowPublicOIDCActions', () => {
  it('only exposes the unauthenticated OIDC entrypoints', () => {
    const calls: Array<[string, string]> = [];
    allowPublicOIDCActions({
      acl: {
        allow: (resourceName, actionName) => {
          calls.push([resourceName, actionName]);
        },
      },
    });

    expect(calls).toEqual([
      [AUTH_RESOURCE, GET_AUTH_URL_ACTION],
      [AUTH_RESOURCE, CALLBACK_ACTION],
    ]);
  });
});
