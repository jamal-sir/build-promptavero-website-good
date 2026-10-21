import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminHeader } from '@/components/admin/admin-header'
import { CategoryForm } from '@/components/admin/category-form'
import { DeleteButton } from '@/components/admin/delete-button'
import { deleteCategoryAction } from '@/lib/admin/actions'
import { requireAdmin } from '@/lib/admin/auth'
import type { Category } from '@/lib/types'

export const metadata: Metadata = { title: 'Edit category' }
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID.test(id)) notFound()

  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('categories').select('*').eq('id', id).maybeSingle()
  if (!data) notFound()
  const category = data as Category

  return (
    <>
      <AdminHeader title="Edit category" />
      <CategoryForm key={category.updated_at} category={category} />
      <div className="mt-10 max-w-2xl border-t border-border pt-6">
        <DeleteButton
          action={deleteCategoryAction}
          id={category.id}
          label="Delete category"
          warning="A category that still contains prompts cannot be deleted. Move or delete its prompts first."
        />
      </div>
    </>
  )
}
