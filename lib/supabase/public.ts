import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const CONTENT_TAG = 'content'
export const CONTENT_REVALIDATE_SECONDS = 300

/**
 * Cookie-less anonymous client for public reads. Because it never touches
 * cookies, pages that use it can be statically rendered and revalidated.
 * RLS guarantees only published, already-live prompts are returned.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            next: { revalidate: CONTENT_REVALIDATE_SECONDS, tags: [CONTENT_TAG] },
          }),
      },
    },
  )
}

/** Uncached anonymous client for request-specific reads (search, suggestions). */
export function createUncachedPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  )
}
