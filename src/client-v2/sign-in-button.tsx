import { useAPIClient } from '@nocobase/client';
import { App, Button } from 'antd';
import type { CSSProperties } from 'react';
import { AUTH_RESOURCE, DEFAULT_BUTTON_HINT, GET_AUTH_URL_ACTION } from '../shared/constants';

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

const hintStyle: CSSProperties = {
  marginTop: 8,
  color: 'rgba(0, 0, 0, 0.45)',
  fontSize: 12,
  lineHeight: 1.5,
  textAlign: 'center',
};

const DEFAULT_BUTTON_LABEL_EN = 'Continue with OIDC';
const DEFAULT_BUTTON_LABEL_ZH = '使用组织账号登录';
const DEFAULT_BUTTON_HINT_ZH = '点击后将跳转到组织统一身份认证，无需在此输入密码。';

interface SignInButtonProps {
  authenticator?: {
    name?: string;
    options?: {
      buttonLabel?: string;
      buttonHint?: string;
    };
  };
}

function browserLanguage() {
  return typeof window !== 'undefined' ? window.navigator.language : undefined;
}

function isChineseLanguage(language?: string) {
  return typeof language === 'string' && language.toLowerCase().startsWith('zh');
}

function defaultButtonText(language?: string) {
  if (isChineseLanguage(language)) {
    return {
      hint: DEFAULT_BUTTON_HINT_ZH,
      label: DEFAULT_BUTTON_LABEL_ZH,
    };
  }

  return {
    hint: DEFAULT_BUTTON_HINT,
    label: DEFAULT_BUTTON_LABEL_EN,
  };
}

export function ExternalOIDCSignInButton(props: SignInButtonProps) {
  const api = useAPIClient();
  const { message } = App.useApp();
  const defaults = defaultButtonText(api.auth.locale ?? browserLanguage());

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
        {props.authenticator?.options?.buttonLabel ?? defaults.label}
      </Button>
      <div style={hintStyle}>{props.authenticator?.options?.buttonHint ?? defaults.hint}</div>
    </div>
  );
}
