import type { Metadata } from 'next'
import Link from 'next/link'
import { SetupForm } from '@/components/admin/login-form'
import { Logo } from '@/components/site/logo'
import { createServiceClient } from '@/lib/supabase/service'

export const metadata: Metadata = { title: 'Set up admin' }

export default async function SetupPage() {
  const { count } = await createServiceClient()
    .from('admin_users')
    .select('user_id', { count: 'exact', head: true })
  const done = (count ?? 0) > 0

  return (
    <main id="main" className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {done ? (
            <>
              <h1 className="text-xl font-semibold tracking-tight">Setup is complete</h1>
              <p className="mb-6 mt-1 text-sm text-muted-foreground">An administrator already exists.</p>
              <Link
                href="/admin/login"
                className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground"
              >
                Go to sign in
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold tracking-tight">Create the administrator</h1>
              <p className="mb-6 mt-1 text-sm text-muted-foreground">
                This account manages the site. This page closes once it is created.
              </p>
              <SetupForm requiresCode={Boolean(process.env.ADMIN_SETUP_CODE)} />
            </>
          )}
        </div>
      </div>
    </main>
  )
}
