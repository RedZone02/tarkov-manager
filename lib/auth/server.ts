import { unstable_rethrow } from 'next/navigation';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { toAuthUser, type AuthUser } from './user';

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data) return null;
    const { sub, email, user_metadata } = data.claims;
    return toAuthUser({ id: sub, email, user_metadata });
  } catch (error) {
    unstable_rethrow(error);
    console.error('Could not read the Supabase session', error);
    return null;
  }
}
