import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import { safeRedirectPath } from '@/lib/auth/user';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { AccountsUnavailable, AuthCard, firstParam } from '../AuthCard';
import { AuthSwitchLink, SignUpForm } from '../AuthForms';

export const metadata: Metadata = { title: 'Create account' };

type SignUpPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const next = safeRedirectPath(firstParam(params.next));
  if (await getCurrentUser()) redirect(next);

  return (
    <AuthCard
      title="Create account"
      description="Anything you've saved in this browser moves into your account when you sign in."
      footer={
        isSupabaseConfigured && (
          <>
            Already have an account?{' '}
            <AuthSwitchLink href="/login" next={next}>
              Sign in
            </AuthSwitchLink>
          </>
        )
      }
    >
      {isSupabaseConfigured ? <SignUpForm next={next} /> : <AccountsUnavailable />}
    </AuthCard>
  );
}
