import { Button } from 'antd';
import { useAPIClient } from '@nocobase/client';
import { AUTH_RESOURCE, GET_AUTH_URL_ACTION } from '../shared/constants';

interface SignInButtonProps {
  authenticator?: {
    name?: string;
  };
}

export function AutheliaSignInButton(props: SignInButtonProps) {
  const api = useAPIClient();

  const signIn = async () => {
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
  };

  return <Button onClick={signIn}>Sign in with Authelia</Button>;
}
