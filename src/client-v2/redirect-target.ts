const DEFAULT_POST_SIGN_IN_REDIRECT = '/admin';

export function postSignInRedirectFrom(location: Pick<Location, 'pathname' | 'search' | 'hash'>): string {
  if (location.pathname === '/signin') {
    const redirect = new URLSearchParams(location.search).get('redirect');
    return redirect && redirect.length > 0 ? redirect : DEFAULT_POST_SIGN_IN_REDIRECT;
  }

  return `${location.pathname}${location.search}${location.hash}`;
}
