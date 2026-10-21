import type { Metadata } from 'next'
import { AdminHeader } from '@/components/admin/admin-header'
import { CategoryForm } from '@/components/admin/category-form'
import { requireAdmin } from '@/lib/admin/auth'

export const metadata: Metadata = { title: 'New category' }
export const dynamic = 'force-dynamic'

export default async function NewCategoryPage() {
  await requireAdmin()
  return (
    <>
      <AdminHeader title="New category" />
      <CategoryForm />
    </>
  )
}
