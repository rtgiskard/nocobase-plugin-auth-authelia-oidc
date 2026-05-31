import { Plugin } from '@nocobase/server';
import { AUTH_RESOURCE, AUTH_TYPE } from '../shared/constants';
import { ExternalOIDCAuth } from './auth';
import { registerActions } from './resource';

export default class PluginExternalOIDCServer extends Plugin {
  async load() {
    this.app.authManager.registerTypes(AUTH_TYPE, {
      auth: ExternalOIDCAuth,
      title: 'External OIDC',
    });

    registerActions(this.app, AUTH_RESOURCE);
  }
}
