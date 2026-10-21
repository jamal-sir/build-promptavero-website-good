import { ExternalLink, LogOut } from 'lucide-react'
import Link from 'next/link'
import { AdminNav } from '@/components/admin/admin-nav'
import { Logo } from '@/components/site/logo'
import { signOutAction } from '@/lib/admin/actions'
import { requireAdmin } from '@/lib/admin/auth'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin()

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1400px] flex-col lg:flex-row">
      <aside className="border-b border-border p-4 lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0 lg:p-5">
        <div className="mb-4 flex items-center justify-between lg:mb-8 lg:block">
          <Link href="/admin" aria-label="Admin dashboard">
            <Logo />
          </Link>
          <Link
            href="/"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground lg:mt-3"
          >
            View site
            <ExternalLink className="size-3" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </Link>
        </div>
        <AdminNav />
        <div className="mt-4 hidden border-t border-border pt-4 lg:block">
          <p className="truncate text-xs text-muted-foreground" title={user.email}>
            {user.email}
          </p>
          <form action={signOutAction} className="mt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main id="main" tabIndex={-1} className="min-w-0 flex-1 p-4 outline-none sm:p-8">
        {children}
        <form action={signOutAction} className="mt-10 border-t border-border pt-4 lg:hidden">
          <button type="submit" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </main>
    </div>
  )
}
