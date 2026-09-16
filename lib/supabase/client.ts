import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { supabasePublishableKey, supabaseUrl } from './env';

export type TypedSupabaseClient = SupabaseClient<Database>;

let browserClient: TypedSupabaseClient | null = null;

export function getSupabaseBrowserClient(): TypedSupabaseClient {
  browserClient ??= createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
  return browserClient;
}
