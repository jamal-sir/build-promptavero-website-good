import { ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AdminHeader, adminGhostButtonClass } from '@/components/admin/admin-header'
import { DeleteButton } from '@/components/admin/delete-button'
import { PromptForm } from '@/components/admin/prompt-form'
import { deletePromptAction } from '@/lib/admin/actions'
import { requireAdmin } from '@/lib/admin/auth'
import type { PromptRecord } from '@/lib/types'

export const metadata: Metadata = { title: 'Edit prompt' }
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditPromptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string }>
}) {
  const [{ id }, { created }] = await Promise.all([params, searchParams])
  if (!UUID.test(id)) notFound()

  const { supabase } = await requireAdmin()
  const [{ data: prompt }, { data: categories }] = await Promise.all([
    supabase.from('prompts').select('*').eq('id', id).maybeSingle(),
    supabase.from('categories').select('id,name').order('sort_order').order('name'),
  ])
  if (!prompt) notFound()

  const record = prompt as PromptRecord
  const live = record.status === 'published' && record.published_at && new Date(record.published_at) <= new Date()

  return (
    <>
      <AdminHeader
        title="Edit prompt"
        description={created ? 'Prompt created.' : undefined}
        actions={
          live ? (
            <Link href={`/prompts/${record.slug}`} target="_blank" rel="noopener" className={adminGhostButtonClass}>
              View live
              <ExternalLink className="size-4" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </Link>
          ) : null
        }
      />
      <PromptForm key={record.updated_at} categories={categories ?? []} prompt={record} />
      <div className="mt-10 border-t border-border pt-6">
        <DeleteButton
          action={deletePromptAction}
          id={record.id}
          label="Delete prompt"
          warning="This permanently removes the prompt and its redirects. This cannot be undone."
        />
      </div>
    </>
  )
}
