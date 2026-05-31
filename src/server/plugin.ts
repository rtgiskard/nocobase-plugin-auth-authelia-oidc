import { Plugin } from '@nocobase/server';
import { AUTH_RESOURCE, AUTH_TYPE, CALLBACK_ACTION, GET_AUTH_URL_ACTION } from '../shared/constants';
import { ExternalOIDCAuth } from './auth';
import { registerActions } from './resource';

interface ACLRegistrationApp {
  acl: {
    allow(resourceName: string, actionName: string): void;
  };
}

export function allowPublicOIDCActions(app: ACLRegistrationApp) {
  app.acl.allow(AUTH_RESOURCE, GET_AUTH_URL_ACTION);
  app.acl.allow(AUTH_RESOURCE, CALLBACK_ACTION);
}

export default class PluginExternalOIDCServer extends Plugin {
  async load() {
    this.app.authManager.registerTypes(AUTH_TYPE, {
      auth: ExternalOIDCAuth,
      title: 'External OIDC',
    });

    registerActions(this.app, AUTH_RESOURCE);
    allowPublicOIDCActions(this.app);
  }
}
