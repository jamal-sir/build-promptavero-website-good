import { Plus } from 'lucide-react'
import Link from 'next/link'
import { AdminHeader, adminButtonClass } from '@/components/admin/admin-header'
import { requireAdmin } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin()
  const nowIso = new Date().toISOString()

  const [total, live, drafts, categories, recent] = await Promise.all([
    supabase.from('prompts').select('id', { count: 'exact', head: true }),
    supabase
      .from('prompts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .lte('published_at', nowIso),
    supabase.from('prompts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase
      .from('prompts')
      .select('id,title,status,updated_at')
      .order('updated_at', { ascending: false })
      .limit(6),
  ])

  const stats = [
    { label: 'Total prompts', value: total.count ?? 0 },
    { label: 'Live', value: live.count ?? 0 },
    { label: 'Drafts', value: drafts.count ?? 0 },
    { label: 'Categories', value: categories.count ?? 0 },
  ]

  return (
    <>
      <AdminHeader
        title="Dashboard"
        description="An overview of your prompt library."
        actions={
          <Link href="/admin/prompts/new" className={adminButtonClass}>
            <Plus className="size-4" aria-hidden="true" />
            New prompt
          </Link>
        }
      />
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <dt className="text-sm text-muted-foreground">{s.label}</dt>
            <dd className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{s.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="recent-heading" className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-heading" className="text-base font-semibold">
            Recently edited
          </h2>
          <Link href="/admin/prompts" className="text-sm font-medium text-brand hover:underline">
            View all
          </Link>
        </div>
        {recent.data?.length ? (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {recent.data.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/prompts/${p.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-muted/50"
                >
                  <span className="truncate font-medium">{p.title}</span>
                  <span className="flex shrink-0 items-center gap-3 text-muted-foreground">
                    <span className="capitalize">{p.status}</span>
                    <time dateTime={p.updated_at} className="hidden sm:inline">
                      {new Date(p.updated_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </time>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No prompts yet. Create your first one to get started.
          </p>
        )}
      </section>
    </>
  )
}
