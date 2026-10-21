import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/site/json-ld'
import { EmptyState, PageHeader } from '@/components/site/page-header'
import { getPopulatedCategories, getSettings } from '@/lib/data/public'
import { breadcrumbJsonLd, buildPageMetadata } from '@/lib/seo'
import { getBaseUrl } from '@/lib/site'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return buildPageMetadata({
    title: 'AI Prompt Categories',
    description:
      'Browse AI image prompts by category: portraits, cinematic photography, 3D illustrations, fantasy art, product shots and more.',
    path: '/categories',
    settings,
  })
}

export default async function CategoriesPage() {
  const [settings, categories] = await Promise.all([
    getSettings(),
    getPopulatedCategories().catch(() => []),
  ])
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Categories', path: '/categories' },
  ]

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs, getBaseUrl(settings))} />
      <PageHeader
        title="Categories"
        description="Find prompts by style and subject."
        crumbs={crumbs}
      />
      <div className="container-page py-12">
        {categories.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/categories/${c.slug}`}
                  className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-6 transition-colors hover:border-foreground/25"
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-lg font-semibold tracking-tight">{c.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {c.prompt_count} {c.prompt_count === 1 ? 'prompt' : 'prompts'}
                    </span>
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">{c.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Categories will appear here">
            A category is listed once it has at least one published prompt.
          </EmptyState>
        )}
      </div>
    </>
  )
}
