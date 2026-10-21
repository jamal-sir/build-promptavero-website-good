import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { AdSlot } from '@/components/site/ad-slot'
import { Breadcrumbs } from '@/components/site/breadcrumbs'
import { CopyPrompt } from '@/components/site/copy-prompt'
import { JsonLd } from '@/components/site/json-ld'
import { PromptGrid } from '@/components/site/prompt-card'
import { findRedirect, getPromptBySlug, getRelatedPrompts, getSettings } from '@/lib/data/public'
import { breadcrumbJsonLd, buildPageMetadata, promptJsonLd } from '@/lib/seo'
import { formatDate, getBaseUrl, truncate } from '@/lib/site'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

async function resolve(slug: string) {
  const prompt = await getPromptBySlug(slug)
  if (prompt) return prompt
  const target = await findRedirect('prompt', slug)
  if (target && target !== slug) permanentRedirect(`/prompts/${target}`)
  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [prompt, settings] = await Promise.all([resolve(slug), getSettings()])
  if (!prompt) return { title: 'Prompt not found', robots: { index: false, follow: false } }

  return buildPageMetadata({
    title: prompt.seo_title || prompt.title,
    description:
      prompt.seo_description || prompt.excerpt || truncate(prompt.prompt_text, 155),
    path: `/prompts/${prompt.slug}`,
    canonicalOverride: prompt.canonical_url,
    image: prompt.featured_image_url
      ? {
          url: prompt.featured_image_url,
          alt: prompt.featured_image_alt,
          width: prompt.image_width,
          height: prompt.image_height,
        }
      : null,
    type: 'article',
    publishedTime: prompt.published_at,
    modifiedTime: prompt.updated_at,
    settings,
  })
}

export default async function PromptPage({ params }: Props) {
  const { slug } = await params
  const prompt = await resolve(slug)
  if (!prompt) notFound()

  const [settings, related] = await Promise.all([
    getSettings(),
    getRelatedPrompts(prompt.id, 3).catch(() => []),
  ])
  const baseUrl = getBaseUrl(settings)
  const category = prompt.categories
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Explore Prompts', path: '/prompts' },
    { name: category.name, path: `/categories/${category.slug}` },
    { name: prompt.title, path: `/prompts/${prompt.slug}` },
  ]
  const description = prompt.seo_description || prompt.excerpt || truncate(prompt.prompt_text, 155)
  const wasUpdated =
    prompt.published_at &&
    new Date(prompt.updated_at).getTime() - new Date(prompt.published_at).getTime() > 24 * 60 * 60 * 1000

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs, baseUrl),
          promptJsonLd({
            title: prompt.title,
            description,
            promptText: prompt.prompt_text,
            path: `/prompts/${prompt.slug}`,
            baseUrl,
            imageUrl: prompt.featured_image_url,
            categoryName: category.name,
            tags: prompt.tags,
            publishedAt: prompt.published_at,
            updatedAt: prompt.updated_at,
            settings,
          }),
        ]}
      />

      <article className="container-narrow py-10 sm:py-14">
        <Breadcrumbs items={crumbs} />

        <header>
          <Link
            href={`/categories/${category.slug}`}
            className="eyebrow text-brand hover:underline"
          >
            {category.name}
          </Link>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl">
            {prompt.title}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {prompt.published_at ? (
              <>
                Published <time dateTime={prompt.published_at}>{formatDate(prompt.published_at)}</time>
              </>
            ) : null}
            {wasUpdated ? (
              <>
                {' '}
                &middot; Updated <time dateTime={prompt.updated_at}>{formatDate(prompt.updated_at)}</time>
              </>
            ) : null}
          </p>
        </header>

        {prompt.featured_image_url ? (
          <figure className="mt-8 overflow-hidden rounded-xl border border-border bg-muted">
            {prompt.image_width && prompt.image_height ? (
              <Image
                src={prompt.featured_image_url}
                alt={prompt.featured_image_alt || prompt.title}
                width={prompt.image_width}
                height={prompt.image_height}
                priority
                sizes="(min-width: 768px) 768px, 100vw"
                className="h-auto w-full"
              />
            ) : (
              <div className="relative aspect-[4/3]">
                <Image
                  src={prompt.featured_image_url}
                  alt={prompt.featured_image_alt || prompt.title}
                  fill
                  priority
                  sizes="(min-width: 768px) 768px, 100vw"
                  className="object-cover"
                />
              </div>
            )}
          </figure>
        ) : null}

        {prompt.excerpt ? (
          <p className="mt-8 text-lg leading-relaxed text-muted-foreground">{prompt.excerpt}</p>
        ) : null}

        <div className="mt-8">
          <CopyPrompt text={prompt.prompt_text} />
        </div>

        {prompt.tags.length ? (
          <section aria-label="Tags" className="mt-8">
            <h2 className="eyebrow mb-3">Tags</h2>
            <ul className="flex flex-wrap gap-2">
              {prompt.tags.map((tag) => (
                <li key={tag}>
                  <Link
                    href={`/search?tag=${encodeURIComponent(tag)}`}
                    className="inline-flex h-8 items-center rounded-full border border-border bg-card px-3 text-sm transition-colors hover:bg-muted"
                  >
                    {tag}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <AdSlot placement="prompt" />
      </article>

      {related.length ? (
        <section className="container-page pb-4" aria-labelledby="related-heading">
          <div className="border-t border-border pt-12">
            <h2 id="related-heading" className="mb-8 text-2xl font-semibold tracking-tight">
              Related prompts
            </h2>
            <PromptGrid prompts={related} />
          </div>
        </section>
      ) : null}
    </>
  )
}
