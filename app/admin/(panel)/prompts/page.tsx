import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { AdminHeader, adminButtonClass, adminGhostButtonClass } from '@/components/admin/admin-header'
import { inputClass } from '@/components/admin/field'
import { requireAdmin } from '@/lib/admin/auth'

export const metadata: Metadata = { title: 'Prompts' }
export const dynamic = 'force-dynamic'

const PER_PAGE = 20

type Row = {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
  featured: boolean
  published_at: string | null
  updated_at: string
  categories: { name: string } | { name: string }[] | null
}

function statusLabel(row: Row) {
  if (row.status === 'draft') return { text: 'Draft', cls: 'bg-muted text-muted-foreground' }
  if (row.published_at && new Date(row.published_at) > new Date()) {
    return { text: 'Scheduled', cls: 'bg-accent text-accent-foreground' }
  }
  return { text: 'Published', cls: 'bg-success/10 text-success' }
}

export default async function AdminPromptsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  const { q = '', status = '', page: pageParam } = await searchParams
  const { supabase } = await requireAdmin()
  const page = Math.max(Number.parseInt(pageParam ?? '1', 10) || 1, 1)

  let query = supabase
    .from('prompts')
    .select('id,title,slug,status,featured,published_at,updated_at,categories(name)', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

  const term = q.trim().replace(/[%_\\,()]/g, ' ').slice(0, 80).trim()
  if (term) query = query.ilike('title', `%${term}%`)
  if (status === 'draft' || status === 'published') query = query.eq('status', status)

  const { data, count } = await query
  const rows = (data ?? []) as unknown as Row[]
  const total = count ?? 0
  const pages = Math.max(Math.ceil(total / PER_PAGE), 1)

  const href = (p: number) => {
    const sp = new URLSearchParams()
    if (term) sp.set('q', term)
    if (status) sp.set('status', status)
    if (p > 1) sp.set('page', String(p))
    const qs = sp.toString()
    return `/admin/prompts${qs ? `?${qs}` : ''}`
  }

  return (
    <>
      <AdminHeader
        title="Prompts"
        description={`${total} ${total === 1 ? 'prompt' : 'prompts'}`}
        actions={
          <Link href="/admin/prompts/new" className={adminButtonClass}>
            <Plus className="size-4" aria-hidden="true" />
            New prompt
          </Link>
        }
      />

      <form method="get" role="search" className="mb-4 flex flex-wrap gap-2">
        <label htmlFor="q" className="sr-only">
          Search prompts by title
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={term}
          placeholder="Search by title"
          className={`${inputClass} max-w-xs`}
        />
        <label htmlFor="status" className="sr-only">
          Filter by status
        </label>
        <select id="status" name="status" defaultValue={status} className={`${inputClass} w-auto`}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <button type="submit" className={adminGhostButtonClass}>
          Filter
        </button>
      </form>

      {rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Title</th>
                <th scope="col" className="px-4 py-3 font-medium">Category</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories
                const s = statusLabel(row)
                return (
                  <tr key={row.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/prompts/${row.id}`} className="font-medium hover:text-brand hover:underline">
                        {row.title}
                      </Link>
                      {row.featured ? (
                        <span className="ml-2 rounded bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-accent-foreground">
                          Featured
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{cat?.name ?? 'None'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.text}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <time dateTime={row.updated_at}>
                        {new Date(row.updated_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                      </time>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {term || status ? 'No prompts match those filters.' : 'No prompts yet. Create your first one.'}
        </p>
      )}

      {pages > 1 ? (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={href(page - 1)} className={adminGhostButtonClass}>
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={href(page + 1)} className={adminGhostButtonClass}>
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  )
}
