import { NextResponse, type NextRequest } from 'next/server';
import { safeRedirectPath } from '@/lib/auth/user';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function loginWithError(request: NextRequest, message: string) {
  const url = new URL('/login', request.nextUrl.origin);
  url.searchParams.set('error', message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeRedirectPath(params.get('next'));
  const code = params.get('code');

  if (!isSupabaseConfigured) return NextResponse.redirect(new URL('/', request.nextUrl.origin));
  if (!code) return loginWithError(request, params.get('error_description') ?? 'That sign-in link is invalid or has expired.');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return loginWithError(request, `Sign-in failed: ${error.message}. Open the link in the same browser you started from.`);

  return NextResponse.redirect(new URL(next, request.nextUrl.origin));
}
