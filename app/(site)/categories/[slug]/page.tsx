import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { AdSlot } from '@/components/site/ad-slot'
import { JsonLd } from '@/components/site/json-ld'
import { EmptyState, PageHeader } from '@/components/site/page-header'
import { Pagination } from '@/components/site/pagination'
import { PromptGrid } from '@/components/site/prompt-card'
import { findRedirect, getCategoryBySlug, getPromptPage, getSettings } from '@/lib/data/public'
import { breadcrumbJsonLd, buildPageMetadata, collectionJsonLd } from '@/lib/seo'
import { getBaseUrl } from '@/lib/site'
import { PAGE_SIZE } from '@/lib/types'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

function parsePage(raw: string | undefined) {
  const n = Number.parseInt(raw ?? '1', 10)
  return Number.isFinite(n) && n >= 1 ? n : 1
}

async function resolve(slug: string) {
  const category = await getCategoryBySlug(slug)
  if (category) return category
  const target = await findRedirect('category', slug)
  if (target && target !== slug) permanentRedirect(`/categories/${target}`)
  return null
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, { page: raw }, settings] = await Promise.all([params, searchParams, getSettings()])
  const category = await resolve(slug)
  if (!category) return { title: 'Category not found', robots: { index: false, follow: false } }
  const page = parsePage(raw)
  const { total } = await getPromptPage(1, category.slug).catch(() => ({ total: 0 }))

  const base = category.seo_title || `${category.name} AI Image Prompts`
  return buildPageMetadata({
    title: page > 1 ? `${base}, Page ${page}` : base,
    description:
      category.seo_description ||
      category.description ||
      `Browse curated ${category.name} prompts for AI image generation.`,
    path: page > 1 ? `/categories/${category.slug}?page=${page}` : `/categories/${category.slug}`,
    noindex: total === 0,
    settings,
  })
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, { page: raw }] = await Promise.all([params, searchParams])
  const category = await resolve(slug)
  if (!category) notFound()

  const page = parsePage(raw)
  const [settings, { items, total }] = await Promise.all([getSettings(), getPromptPage(page, category.slug)])
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  if (page > totalPages) notFound()

  const baseUrl = getBaseUrl(settings)
  const path = `/categories/${category.slug}`
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Categories', path: '/categories' },
    { name: category.name, path },
  ]

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs, baseUrl),
          collectionJsonLd({
            name: `${category.name} AI Image Prompts`,
            description: category.description,
            path,
            items,
            baseUrl,
          }),
        ]}
      />
      <PageHeader title={category.name} description={category.description} eyebrow="Category" crumbs={crumbs} />
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
              hrefFor={(p) => (p === 1 ? path : `${path}?page=${p}`)}
            />
          </>
        ) : (
          <EmptyState title="No prompts in this category yet">
            Prompts for {category.name} are coming soon.
          </EmptyState>
        )}
      </div>
    </>
  )
}
