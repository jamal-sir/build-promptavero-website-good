import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/admin/login-form'
import { Logo } from '@/components/site/logo'
import { getAdminContext } from '@/lib/admin/auth'
import { safeAdminPath } from '@/lib/admin/validate'
import { createServiceClient } from '@/lib/supabase/service'

export const metadata: Metadata = { title: 'Sign in' }

async function needsSetup() {
  try {
    const { count } = await createServiceClient()
      .from('admin_users')
      .select('user_id', { count: 'exact', head: true })
    return (count ?? 0) === 0
  } catch {
    return false
  }
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  if (await getAdminContext()) redirect(safeAdminPath(next))
  const setup = await needsSetup()

  return (
    <main id="main" className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Admin sign in</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Sign in to manage prompts and site settings.</p>
          <LoginForm next={next} />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {setup ? (
            <>
              No administrator yet?{' '}
              <Link href="/admin/setup" className="font-medium text-brand hover:underline">
                Create the first one
              </Link>
              .
            </>
          ) : (
            <Link href="/" className="hover:underline">
              Back to site
            </Link>
          )}
        </p>
      </div>
    </main>
  )
}
