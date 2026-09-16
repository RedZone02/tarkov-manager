'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/context';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { hasLocalProgress, importLocalProgress } from '@/lib/storage/import';
import { refreshCloudStores, resetCloudStores } from '@/lib/storage/store';

export default function ProgressSync() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const previousUserId = useRef(userId);

  useEffect(() => {
    if (previousUserId.current && previousUserId.current !== userId) resetCloudStores();
    previousUserId.current = userId;
  }, [userId]);

  useEffect(() => {
    if (!userId || !hasLocalProgress()) return;
    importLocalProgress(getSupabaseBrowserClient(), userId)
      .then((imported) => {
        if (imported) refreshCloudStores();
      })
      .catch((error) => console.error('Could not import progress saved in this browser', error));
  }, [userId]);

  return null;
}
