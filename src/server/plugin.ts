import { Plugin } from '@nocobase/server';
import { AUTH_RESOURCE, AUTH_TYPE } from '../shared/constants';
import { AutheliaOIDCAuth } from './auth';
import { registerActions } from './resource';

export default class PluginAutheliaOIDCServer extends Plugin {
  async load() {
    this.app.authManager.registerTypes(AUTH_TYPE, {
      auth: AutheliaOIDCAuth,
      title: 'Authelia OIDC',
    });

    registerActions(this.app, AUTH_RESOURCE);
  }
}
