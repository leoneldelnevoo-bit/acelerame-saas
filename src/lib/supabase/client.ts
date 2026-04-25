'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createMasterBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_MASTER_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_MASTER_ANON_KEY!,
    {
      db: { schema: 'master' },
    }
  )
}
