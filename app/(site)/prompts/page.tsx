import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdSlot } from '@/components/site/ad-slot'
import { JsonLd } from '@/components/site/json-ld'
import { EmptyState, PageHeader } from '@/components/site/page-header'
import { Pagination } from '@/components/site/pagination'
import { PromptGrid } from '@/components/site/prompt-card'
import { getPromptPage, getSettings } from '@/lib/data/public'
import { breadcrumbJsonLd, buildPageMetadata, collectionJsonLd } from '@/lib/seo'
import { getBaseUrl } from '@/lib/site'
import { PAGE_SIZE } from '@/lib/types'

type Props = { searchParams: Promise<{ page?: string }> }

function parsePage(raw: string | undefined) {
  const n = Number.parseInt(raw ?? '1', 10)
  return Number.isFinite(n) && n >= 1 ? n : 1
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [{ page: raw }, settings] = await Promise.all([searchParams, getSettings()])
  const page = parsePage(raw)
  return buildPageMetadata({
    title: page > 1 ? `Explore AI Image Prompts, Page ${page}` : 'Explore AI Image Prompts',
    description:
      'Browse the full library of curated AI image-generation prompts. Copy a prompt, adapt it, and generate your own images.',
    path: page > 1 ? `/prompts?page=${page}` : '/prompts',
    settings,
  })
}

export default async function PromptsPage({ searchParams }: Props) {
  const { page: raw } = await searchParams
  const page = parsePage(raw)
  const [settings, { items, total }] = await Promise.all([getSettings(), getPromptPage(page)])
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  if (page > totalPages) notFound()

  const baseUrl = getBaseUrl(settings)
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Explore Prompts', path: '/prompts' },
  ]

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs, baseUrl),
          collectionJsonLd({
            name: 'Explore AI Image Prompts',
            description: 'A curated library of AI image-generation prompts.',
            path: '/prompts',
            items,
            baseUrl,
          }),
        ]}
      />
      <PageHeader
        title="Explore prompts"
        description="Every prompt is written to be copied, adapted and run in the image model of your choice."
        crumbs={crumbs}
      />
      <div className="container-page py-12">
        {items.length ? (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              {total} {total === 1 ? 'prompt' : 'prompts'}
            </p>
            <PromptGrid prompts={items} priorityCount={3} />
            <AdSlot placement="listing" />
            <Pagination
              page={page}
              totalPages={totalPages}
              hrefFor={(p) => (p === 1 ? '/prompts' : `/prompts?page=${p}`)}
            />
          </>
        ) : (
          <EmptyState title="No prompts published yet">Check back soon for the first collection.</EmptyState>
        )}
      </div>
    </>
  )
}
