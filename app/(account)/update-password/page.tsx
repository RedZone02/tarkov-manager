import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { AccountsUnavailable, AuthCard } from '../AuthCard';
import { UpdatePasswordForm } from '../AuthForms';

export const metadata: Metadata = { title: 'Choose a new password' };

export default async function UpdatePasswordPage() {
  if (!isSupabaseConfigured) {
    return (
      <AuthCard title="Choose a new password" description="Set the password you'll use to sign in.">
        <AccountsUnavailable />
      </AuthCard>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/update-password');

  return (
    <AuthCard title="Choose a new password" description={`Set the password for ${user.email ?? user.name}.`}>
      <UpdatePasswordForm />
    </AuthCard>
  );
}
