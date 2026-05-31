import { Plugin } from '@nocobase/client';
import AuthPlugin from '@nocobase/plugin-auth/client';
import { AUTH_TYPE } from '../shared/constants';
import { AutheliaSignInButton } from './sign-in-button';
import { AutheliaSettingsForm } from './settings-form';

export default class PluginAutheliaOIDCClient extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType(AUTH_TYPE, {
      components: {
        SignInButton: AutheliaSignInButton,
        AdminSettingsForm: AutheliaSettingsForm,
      },
    });
  }
}
