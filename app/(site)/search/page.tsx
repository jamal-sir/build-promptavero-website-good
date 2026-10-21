import type { Metadata } from 'next'
import Link from 'next/link'
import { EmptyState, PageHeader } from '@/components/site/page-header'
import { Pagination } from '@/components/site/pagination'
import { PromptGrid } from '@/components/site/prompt-card'
import { SearchBox } from '@/components/site/search-box'
import { getCategories, getPopulatedCategories, getSettings, getTags, searchPrompts } from '@/lib/data/public'
import { buildPageMetadata } from '@/lib/seo'
import { PAGE_SIZE } from '@/lib/types'

type RawParams = { q?: string; category?: string; tag?: string; sort?: string; page?: string }
type Props = { searchParams: Promise<RawParams> }

const SORTS = ['relevance', 'newest', 'oldest', 'title'] as const
type Sort = (typeof SORTS)[number]

function normalize(raw: RawParams) {
  const q = raw.q?.trim().slice(0, 100) || ''
  const category = raw.category?.trim().slice(0, 80) || ''
  const tag = raw.tag?.trim().toLowerCase().slice(0, 60) || ''
  const requested = SORTS.includes(raw.sort as Sort) ? (raw.sort as Sort) : undefined
  const sort: Sort = requested === 'relevance' && !q ? 'newest' : (requested ?? (q ? 'relevance' : 'newest'))
  const n = Number.parseInt(raw.page ?? '1', 10)
  const page = Number.isFinite(n) && n >= 1 ? n : 1
  return { q, category, tag, sort, page }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [raw, settings] = await Promise.all([searchParams, getSettings()])
  const { q } = normalize(raw)
  return buildPageMetadata({
    title: q ? `Search results for "${q}"` : 'Search Prompts',
    description: 'Search the library of curated AI image-generation prompts.',
    path: '/search',
    noindex: true,
    settings,
  })
}

export default async function SearchPage({ searchParams }: Props) {
  const raw = await searchParams
  const { q, category, tag, sort, page } = normalize(raw)
  const filtered = Boolean(q || category || tag)

  const [categories, popularCategories, tags, result] = await Promise.all([
    getCategories().catch(() => []),
    getPopulatedCategories().catch(() => []),
    getTags(16).catch(() => []),
    filtered
      ? searchPrompts({ q, category, tag, sort, page }).catch(() => null)
      : Promise.resolve({ items: [], total: 0 }),
  ])

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1

  function hrefFor(p: number) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (category) params.set('category', category)
    if (tag) params.set('tag', tag)
    if (sort !== (q ? 'relevance' : 'newest')) params.set('sort', sort)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/search?${qs}` : '/search'
  }

  const selectClass =
    'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

  return (
    <>
      <PageHeader
        title={q ? `Results for "${q}"` : 'Search prompts'}
        description="Search by subject, style, mood or tag."
        crumbs={[
          { name: 'Home', path: '/' },
          { name: 'Search', path: '/search' },
        ]}
      >
        <SearchBox variant="hero" defaultValue={q} className="mt-8 max-w-2xl" />
      </PageHeader>

      <div className="container-page py-10">
        <form action="/search" method="get" className="mb-8 grid items-end gap-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <input type="hidden" name="q" value={q} />
          <div>
            <label htmlFor="filter-category" className="mb-1.5 block text-sm font-medium">
              Category
            </label>
            <select id="filter-category" name="category" defaultValue={category} className={selectClass}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-tag" className="mb-1.5 block text-sm font-medium">
              Tag
            </label>
            <input
              id="filter-tag"
              name="tag"
              defaultValue={tag}
              maxLength={60}
              placeholder="Any tag"
              className={selectClass}
            />
          </div>
          <div>
            <label htmlFor="filter-sort" className="mb-1.5 block text-sm font-medium">
              Sort by
            </label>
            <select id="filter-sort" name="sort" defaultValue={sort} className={selectClass}>
              {q ? <option value="relevance">Relevance</option> : null}
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title A to Z</option>
            </select>
          </div>
          <button
            type="submit"
            className="h-10 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Apply
          </button>
        </form>

        {!filtered ? (
          <div className="space-y-10">
            <p className="text-muted-foreground">Enter a search above, or start from a category or tag.</p>
            {popularCategories.length ? (
              <section>
                <h2 className="eyebrow mb-3">Categories</h2>
                <ul className="flex flex-wrap gap-2">
                  {popularCategories.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/search?category=${c.slug}`}
                        className="inline-flex h-9 items-center rounded-full border border-border bg-card px-4 text-sm hover:bg-muted"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {tags.length ? (
              <section>
                <h2 className="eyebrow mb-3">Popular tags</h2>
                <ul className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <li key={t.tag}>
                      <Link
                        href={`/search?tag=${encodeURIComponent(t.tag)}`}
                        className="inline-flex h-9 items-center rounded-full border border-border bg-card px-4 text-sm hover:bg-muted"
                      >
                        {t.tag}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : result === null ? (
          <EmptyState title="Search is unavailable right now">Please try again in a moment.</EmptyState>
        ) : result.items.length ? (
          <>
            <p className="mb-6 text-sm text-muted-foreground" role="status">
              {result.total} {result.total === 1 ? 'result' : 'results'}
              {tag ? ` tagged "${tag}"` : ''}
            </p>
            <PromptGrid prompts={result.items} />
            <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} hrefFor={hrefFor} />
          </>
        ) : (
          <EmptyState title="No prompts matched your search">
            <p>Try fewer words, a different spelling, or clear the filters.</p>
            <p className="mt-4">
              <Link href="/prompts" className="font-medium text-brand hover:underline">
                Explore all prompts
              </Link>
            </p>
          </EmptyState>
        )}
      </div>
    </>
  )
}
