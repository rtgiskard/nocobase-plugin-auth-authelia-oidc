import { Plugin } from '@nocobase/client';
import AuthPlugin from '@nocobase/plugin-auth/client';
import { AUTH_TYPE } from '../shared/constants';
import { ExternalOIDCSettingsForm } from './settings-form';
import { ExternalOIDCSignInButton } from './sign-in-button';

export default class PluginExternalOIDCClient extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType(AUTH_TYPE, {
      components: {
        SignInButton: ExternalOIDCSignInButton,
        AdminSettingsForm: ExternalOIDCSettingsForm,
      },
    });
  }
}
