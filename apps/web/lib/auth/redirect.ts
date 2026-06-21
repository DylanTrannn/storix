import type { UserRole } from '@storix/shared';

/** Default landing path after login based on role. Honors an explicit redirect when safe. */
export function getPostLoginPath(role: UserRole, redirectParam?: string | null): string {
  if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
    return redirectParam;
  }
  return role === 'admin' ? '/admin' : '/account';
}
