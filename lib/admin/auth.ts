import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const getAdminContext = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin !== true) return null
  return { supabase, user }
})

/** For pages: redirects unauthenticated or non-admin visitors to the login page. */
export async function requireAdmin() {
  const ctx = await getAdminContext()
  if (!ctx) redirect('/admin/login')
  return ctx
}

/** For server actions and route handlers: throws instead of redirecting. */
export async function assertAdmin() {
  const ctx = await getAdminContext()
  if (!ctx) throw new Error('UNAUTHORIZED')
  return ctx
}
