'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { isSignedOutOnlyPath } from '@/lib/auth/user';
import { cn } from '@/lib/cn';
import { useSyncStatus } from '@/lib/storage/hooks';
import { refreshCloudStores, resetCloudStores } from '@/lib/storage/store';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button, ButtonLink } from './ui/Button';

const statusText = {
  idle: 'All changes saved to your account',
  syncing: 'Syncing…',
  error: 'Sync problem',
};

export default function AccountMenu() {
  const { enabled, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { status, error } = useSyncStatus();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isOpen = openPath === pathname;

  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpenPath(null);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  if (!enabled) return null;

  if (!user) {
    const href = isSignedOutOnlyPath(pathname) || pathname === '/' ? '/login' : `/login?next=${encodeURIComponent(pathname)}`;
    return (
      <ButtonLink href={href} variant="primary" size="sm">
        Sign in
      </ButtonLink>
    );
  }

  async function signOut() {
    setSigningOut(true);
    await getSupabaseBrowserClient().auth.signOut({ scope: 'local' });
    resetCloudStores();
    setSigningOut(false);
    setOpenPath(null);
    router.refresh();
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          event.stopPropagation();
          setOpenPath(null);
          buttonRef.current?.focus();
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Account: ${user.name}`}
        aria-expanded={isOpen}
        aria-controls="account-menu"
        onClick={() => setOpenPath(isOpen ? null : pathname)}
        className="relative inline-flex size-9 items-center justify-center rounded-full border border-border bg-surface-2 text-sm font-semibold text-text transition-colors hover:border-muted"
      >
        {user.avatarUrl ? (
          <Image src={user.avatarUrl} alt="" width={36} height={36} unoptimized referrerPolicy="no-referrer" className="size-full rounded-full object-cover" />
        ) : (
          <span aria-hidden>{user.name.charAt(0).toUpperCase()}</span>
        )}
        {status !== 'idle' && (
          <span
            aria-hidden
            className={cn(
              'absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-bg',
              status === 'error' ? 'bg-accent' : 'animate-pulse bg-warning',
            )}
          />
        )}
      </button>

      {isOpen && (
        <div id="account-menu" className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-surface p-4 shadow-xl">
          <p className="truncate font-semibold">{user.name}</p>
          {user.email && <p className="truncate text-sm text-muted">{user.email}</p>}

          <div className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm" role="status">
            <p className={cn('font-medium', status === 'error' ? 'text-accent' : status === 'syncing' ? 'text-warning' : 'text-success')}>
              {statusText[status]}
            </p>
            {error && <p className="mt-1 text-xs text-muted">{error}</p>}
            {status === 'error' && (
              <Button size="sm" className="mt-2" onClick={refreshCloudStores}>
                Reload from account
              </Button>
            )}
          </div>

          <Button className="mt-3 w-full" onClick={signOut} disabled={signingOut}>
            {signingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </div>
      )}
    </div>
  );
}
