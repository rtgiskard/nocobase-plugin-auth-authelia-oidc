import { useAPIClient } from '@nocobase/client';
import { App, Button } from 'antd';
import type { CSSProperties } from 'react';
import { AUTH_RESOURCE, GET_AUTH_URL_ACTION } from '../shared/constants';

const buttonContainerStyle: CSSProperties = {
  marginTop: 12,
};

const signInButtonStyle: CSSProperties = {
  height: 44,
  borderRadius: 12,
  fontWeight: 600,
  letterSpacing: '0.01em',
  boxShadow: '0 8px 20px rgba(22, 119, 255, 0.18)',
};

interface SignInButtonProps {
  authenticator?: {
    name?: string;
    options?: {
      buttonLabel?: string;
    };
  };
}

export function ExternalOIDCSignInButton(props: SignInButtonProps) {
  const api = useAPIClient();
  const { message } = App.useApp();

  const signIn = async () => {
    try {
      const redirectTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const result = await api.resource(AUTH_RESOURCE)[GET_AUTH_URL_ACTION]({
        values: {
          authenticator: props.authenticator?.name,
          redirectTo,
        },
      });
      const url = result?.data?.data?.url;
      if (typeof url !== 'string') throw new Error('OIDC authorization URL is missing');
      window.location.assign(url);
    } catch (error) {
      const content = error instanceof Error ? error.message : 'Failed to start OIDC sign-in';
      message.error(content);
    }
  };

  return (
    <div style={buttonContainerStyle}>
      <Button block type="primary" size="large" onClick={signIn} style={signInButtonStyle}>
        {props.authenticator?.options?.buttonLabel ?? 'Sign in with OIDC'}
      </Button>
    </div>
  );
}
