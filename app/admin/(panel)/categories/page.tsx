import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { AdminHeader, adminButtonClass } from '@/components/admin/admin-header'
import { requireAdmin } from '@/lib/admin/auth'

export const metadata: Metadata = { title: 'Categories' }
export const dynamic = 'force-dynamic'

type Row = {
  id: string
  name: string
  slug: string
  sort_order: number
  prompts: { count: number }[] | null
}

export default async function AdminCategoriesPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase
    .from('categories')
    .select('id,name,slug,sort_order,prompts(count)')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  const rows = (data ?? []) as unknown as Row[]

  return (
    <>
      <AdminHeader
        title="Categories"
        description={`${rows.length} ${rows.length === 1 ? 'category' : 'categories'}`}
        actions={
          <Link href="/admin/categories/new" className={adminButtonClass}>
            <Plus className="size-4" aria-hidden="true" />
            New category
          </Link>
        }
      />
      {rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Slug</th>
                <th scope="col" className="px-4 py-3 font-medium">Prompts</th>
                <th scope="col" className="px-4 py-3 font-medium">Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/categories/${row.id}`} className="font-medium hover:text-brand hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.slug}</td>
                  <td className="px-4 py-3 tabular-nums">{row.prompts?.[0]?.count ?? 0}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.sort_order}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No categories yet.
        </p>
      )}
    </>
  )
}
