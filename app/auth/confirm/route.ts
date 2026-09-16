import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { safeRedirectPath } from '@/lib/auth/user';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const EMAIL_OTP_TYPES: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get('token_hash');
  const type = params.get('type') as EmailOtpType | null;
  const next = type === 'recovery' ? '/update-password' : safeRedirectPath(params.get('next'));

  if (!isSupabaseConfigured) return NextResponse.redirect(new URL('/', request.nextUrl.origin));

  if (tokenHash && type && EMAIL_OTP_TYPES.includes(type)) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, request.nextUrl.origin));
  }

  const url = new URL('/login', request.nextUrl.origin);
  url.searchParams.set('error', 'That email link is invalid or has expired.');
  return NextResponse.redirect(url);
}
