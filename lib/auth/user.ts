export type AuthUser = {
  id: string;
  email: string | null;
  name: string;
  avatarUrl: string | null;
};

type UserSource = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

function readString(metadata: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export function toAuthUser({ id, email, user_metadata }: UserSource): AuthUser {
  const metadata = user_metadata ?? {};
  const customClaims = typeof metadata.custom_claims === 'object' && metadata.custom_claims !== null ? (metadata.custom_claims as Record<string, unknown>) : {};
  return {
    id,
    email: email ?? null,
    name:
      readString(customClaims, 'global_name') ??
      readString(metadata, 'full_name', 'name', 'user_name', 'preferred_username') ??
      email?.split('@')[0] ??
      'Player',
    avatarUrl: readString(metadata, 'avatar_url', 'picture'),
  };
}

export function isSameAuthUser(a: AuthUser | null, b: AuthUser | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.id === b.id && a.email === b.email && a.name === b.name && a.avatarUrl === b.avatarUrl;
}

const SIGNED_OUT_ONLY_PATHS = ['/login', '/signup', '/forgot-password', '/auth'];

export function isSignedOutOnlyPath(path: string): boolean {
  const pathname = path.split(/[?#]/)[0];
  return SIGNED_OUT_ONLY_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function safeRedirectPath(value: string | null | undefined, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  return isSignedOutOnlyPath(value) ? fallback : value;
}
