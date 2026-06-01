import { Plugin } from '@nocobase/client';
import AuthPlugin from '@nocobase/plugin-auth/client';
import { AUTH_TYPE } from '../shared/constants';
import { completeOidcCallback } from './callback';
import { ExternalOIDCSettingsForm } from './settings-form';
import { ExternalOIDCSignInButton } from './sign-in-button';

export default class PluginExternalOIDCClient extends Plugin {
  async load() {
    void completeOidcCallback(this.app.apiClient).catch((error) => {
      console.error('OIDC callback exchange failed', error);
    });

    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType(AUTH_TYPE, {
      components: {
        SignInButton: ExternalOIDCSignInButton,
        AdminSettingsForm: ExternalOIDCSettingsForm,
      },
    });
  }
}
