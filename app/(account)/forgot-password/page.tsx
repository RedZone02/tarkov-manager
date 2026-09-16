import type { Metadata } from 'next';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { AccountsUnavailable, AuthCard } from '../AuthCard';
import { AuthSwitchLink, ForgotPasswordForm } from '../AuthForms';

export const metadata: Metadata = { title: 'Reset password' };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset password"
      description="Enter your account email and we'll send you a link to choose a new password."
      footer={
        isSupabaseConfigured && (
          <>
            Remembered it?{' '}
            <AuthSwitchLink href="/login" next="/">
              Back to sign in
            </AuthSwitchLink>
          </>
        )
      }
    >
      {isSupabaseConfigured ? <ForgotPasswordForm /> : <AccountsUnavailable />}
    </AuthCard>
  );
}
