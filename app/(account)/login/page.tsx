import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import { safeRedirectPath } from '@/lib/auth/user';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { AccountsUnavailable, AuthCard, firstParam } from '../AuthCard';
import { AuthSwitchLink, SignInForm } from '../AuthForms';

export const metadata: Metadata = { title: 'Sign in' };

type LoginPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeRedirectPath(firstParam(params.next));
  if (await getCurrentUser()) redirect(next);

  return (
    <AuthCard
      title="Sign in"
      description="Keep your quests, hideout and raid log in sync on every device."
      footer={
        isSupabaseConfigured && (
          <>
            New here?{' '}
            <AuthSwitchLink href="/signup" next={next}>
              Create an account
            </AuthSwitchLink>
          </>
        )
      }
    >
      {isSupabaseConfigured ? <SignInForm next={next} initialError={firstParam(params.error)} /> : <AccountsUnavailable />}
    </AuthCard>
  );
}
