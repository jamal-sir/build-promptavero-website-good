import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { JsonLd } from '@/components/site/json-ld'
import { PromptGrid } from '@/components/site/prompt-card'
import { SearchBox } from '@/components/site/search-box'
import {
  getFeaturedPrompts,
  getPopulatedCategories,
  getPromptPage,
  getSettings,
} from '@/lib/data/public'
import { buildPageMetadata, organizationJsonLd, websiteJsonLd } from '@/lib/seo'
import { getBaseUrl } from '@/lib/site'
import type { PromptCardData } from '@/lib/types'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return buildPageMetadata({
    title: settings.default_seo_title,
    absoluteTitle: true,
    description: settings.default_seo_description,
    path: '/',
    settings,
  })
}

function SectionHeading({ eyebrow, title, href, linkLabel }: { eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      </div>
      {href && linkLabel ? (
        <Link href={href} className="hidden items-center gap-1 text-sm font-medium text-brand hover:underline sm:inline-flex">
          {linkLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  )
}

export default async function HomePage() {
  const settings = await getSettings()
  const [featured, categories, latest] = await Promise.all([
    getFeaturedPrompts(6).catch((): PromptCardData[] => []),
    getPopulatedCategories().catch(() => []),
    getPromptPage(1).catch(() => ({ items: [] as PromptCardData[], total: 0 })),
  ])
  const baseUrl = getBaseUrl(settings)
  const latestItems = latest.items.slice(0, 6)
  const hasPrompts = latest.total > 0

  return (
    <>
      <JsonLd data={[websiteJsonLd(settings, baseUrl), organizationJsonLd(settings, baseUrl)]} />

      <section className="relative overflow-hidden border-b border-border/70">
        <div className="hairline-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="container-page relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="eyebrow mb-5">AI image prompt library</p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl">
              Prompts worth generating from.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              A curated library of detailed, copy-ready prompts for portraits, cinematic scenes, 3D illustrations,
              fantasy art and product photography.
            </p>
            <SearchBox variant="hero" className="mt-8 max-w-xl" placeholder="Try &quot;cinematic portrait&quot; or &quot;isometric room&quot;" />
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/prompts"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Explore Prompts
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/categories"
                className="inline-flex h-11 items-center rounded-lg border border-border bg-card px-5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Browse Categories
              </Link>
            </div>
          </div>

          <div className="hidden lg:block" aria-hidden="true">
            <div className="rotate-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-3">
                <span className="size-2.5 rounded-full bg-border" />
                <span className="size-2.5 rounded-full bg-border" />
                <span className="size-2.5 rounded-full bg-border" />
                <span className="eyebrow ml-2">Example prompt</span>
              </div>
              <p className="p-6 font-mono text-sm leading-7 text-foreground">
                Cinematic portrait of a lighthouse keeper at dusk, 85mm lens, shallow depth of field, warm tungsten
                window light against cool blue fog, film grain, muted teal and amber grade
                <span className="caret ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-brand align-middle" />
              </p>
            </div>
          </div>
        </div>
      </section>

      {!hasPrompts ? (
        <section className="container-page py-20">
          <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
            <h2 className="text-xl font-semibold">The first prompts are on their way</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              New prompts are published regularly. Check back soon, or browse the categories to see what is coming.
            </p>
          </div>
        </section>
      ) : null}

      {categories.length ? (
        <section className="container-page pt-16 sm:pt-20" aria-labelledby="home-categories">
          <SectionHeading eyebrow="Browse" title="Popular categories" href="/categories" linkLabel="All categories" />
          <h2 id="home-categories" className="sr-only">Popular categories</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/categories/${c.slug}`}
                  className="group flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/25"
                >
                  <span className="flex items-center justify-between">
                    <span className="font-semibold">{c.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{c.prompt_count}</span>
                  </span>
                  <span className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{c.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {featured.length ? (
        <section className="container-page pt-16 sm:pt-20">
          <SectionHeading eyebrow="Editor's picks" title="Featured prompts" href="/prompts" linkLabel="Explore all" />
          <PromptGrid prompts={featured} />
        </section>
      ) : null}

      {latestItems.length ? (
        <section className="container-page pt-16 sm:pt-20">
          <SectionHeading eyebrow="New" title="Latest prompts" href="/prompts" linkLabel="Explore all" />
          <PromptGrid prompts={latestItems} />
          <div className="mt-8 text-center sm:hidden">
            <Link href="/prompts" className="text-sm font-medium text-brand hover:underline">
              Explore all prompts
            </Link>
          </div>
        </section>
      ) : null}
    </>
  )
}
