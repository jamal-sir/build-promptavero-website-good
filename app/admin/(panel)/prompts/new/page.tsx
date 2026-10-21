import type { Metadata } from 'next'
import Link from 'next/link'
import { AdminHeader } from '@/components/admin/admin-header'
import { PromptForm } from '@/components/admin/prompt-form'
import { requireAdmin } from '@/lib/admin/auth'

export const metadata: Metadata = { title: 'New prompt' }
export const dynamic = 'force-dynamic'

export default async function NewPromptPage() {
  const { supabase } = await requireAdmin()
  const { data: categories } = await supabase
    .from('categories')
    .select('id,name')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  return (
    <>
      <AdminHeader title="New prompt" />
      {categories?.length ? (
        <PromptForm categories={categories} />
      ) : (
        <p className="rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
          Create a category first.{' '}
          <Link href="/admin/categories/new" className="font-medium text-brand hover:underline">
            Add a category
          </Link>
          .
        </p>
      )}
    </>
  )
}
