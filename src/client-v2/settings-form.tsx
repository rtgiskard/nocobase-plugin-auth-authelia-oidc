import { Alert, Form, Input, Switch } from 'antd';
import { DEFAULT_ISSUER, DEFAULT_SCOPE } from '../shared/constants';

export function AutheliaSettingsForm() {
  return (
    <>
      <Alert
        type="warning"
        showIcon
        message="Keep client secrets in environment variables"
        description="Set clientSecretEnv to an environment variable name. Avoid storing clientSecret in NocoBase database unless this is only a temporary test environment."
      />
      <Form.Item name={["options", "issuer"]} label="Issuer" initialValue={DEFAULT_ISSUER} rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name={["options", "clientId"]} label="Client ID" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name={["options", "clientSecretEnv"]} label="Client secret env" initialValue="NOCOBASE_AUTHELIA_OIDC_CLIENT_SECRET">
        <Input />
      </Form.Item>
      <Form.Item name={["options", "redirectUri"]} label="Redirect URI" rules={[{ required: true }]}>
        <Input placeholder="https://nocobase.example.com/api/authelia-oidc:redirect" />
      </Form.Item>
      <Form.Item name={["options", "scope"]} label="Scope" initialValue={DEFAULT_SCOPE} rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name={["options", "autoSignUp"]} label="Auto sign up" valuePropName="checked" initialValue>
        <Switch />
      </Form.Item>
    </>
  );
}
