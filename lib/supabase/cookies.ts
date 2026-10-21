import type { CookieOptionsWithName } from '@supabase/ssr'

/**
 * Production uses first-party, SameSite=Lax cookies. Outside production the
 * app is previewed inside a cross-site iframe, which needs SameSite=None.
 */
export const authCookieOptions: CookieOptionsWithName =
  process.env.NODE_ENV === 'production'
    ? { secure: true, sameSite: 'lax' }
    : { secure: true, sameSite: 'none' }
