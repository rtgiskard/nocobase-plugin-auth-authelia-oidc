import { SchemaComponent } from '@nocobase/client';
import { Alert, Input, Switch, type SwitchProps } from 'antd';
import type { ComponentType } from 'react';
import { DEFAULT_BUTTON_HINT, DEFAULT_BUTTON_LABEL, DEFAULT_EMAIL_CLAIM, DEFAULT_ISSUER, DEFAULT_NICKNAME_CLAIM, DEFAULT_SCOPE, DEFAULT_USERNAME_CLAIM } from '../shared/constants';

interface FormilySwitchProps extends Omit<SwitchProps, 'checked' | 'onChange'> {
  value?: boolean;
  onChange?: (value: boolean) => void;
}

function FormilySwitch({ value, onChange, ...props }: FormilySwitchProps) {
  return <Switch {...props} checked={Boolean(value)} onChange={onChange} />;
}

const settingsFormSchema = {
  type: 'object',
  properties: {
    issuer: {
      type: 'string',
      title: 'Issuer',
      default: DEFAULT_ISSUER,
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    clientId: {
      type: 'string',
      title: 'Client ID',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    clientSecretEnv: {
      type: 'string',
      title: 'Client secret env',
      default: 'NOCOBASE_OIDC_CLIENT_SECRET',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    redirectUri: {
      type: 'string',
      title: 'Redirect URI',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: 'https://nocobase.example.com/api/oidc-external:redirect',
      },
    },
    scope: {
      type: 'string',
      title: 'Scope',
      default: DEFAULT_SCOPE,
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    usernameClaim: {
      type: 'string',
      title: 'Username claim',
      default: DEFAULT_USERNAME_CLAIM,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    nicknameClaim: {
      type: 'string',
      title: 'Nickname claim',
      default: DEFAULT_NICKNAME_CLAIM,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    emailClaim: {
      type: 'string',
      title: 'Email claim',
      default: DEFAULT_EMAIL_CLAIM,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    buttonLabel: {
      type: 'string',
      title: 'Button label',
      default: DEFAULT_BUTTON_LABEL,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    buttonHint: {
      type: 'string',
      title: 'Button hint',
      default: DEFAULT_BUTTON_HINT,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    autoSignUp: {
      type: 'boolean',
      title: 'Auto sign up',
      default: true,
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
    },
  },
};

const schemaComponents = { Input, Switch: FormilySwitch };
const SettingsSchemaComponent = SchemaComponent as unknown as ComponentType<{
  schema: typeof settingsFormSchema;
  components: typeof schemaComponents;
}>;

export function ExternalOIDCSettingsForm() {
  return (
    <>
      <Alert
        type="warning"
        showIcon
        message="Keep client secrets in environment variables"
        description="Set clientSecretEnv to an environment variable name. Avoid storing clientSecret in NocoBase database unless this is only a temporary test environment."
      />
      <SettingsSchemaComponent schema={settingsFormSchema} components={schemaComponents} />
    </>
  );
}
