import type { MetadataRoute } from 'next'
import { getPopulatedCategories, getSettings, getSitemapPrompts } from '@/lib/data/public'
import { absoluteUrl, getBaseUrl } from '@/lib/site'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSettings()
  if (!settings.sitemap_enabled || !settings.allow_indexing) return []

  const base = getBaseUrl(settings)
  const [prompts, categories] = await Promise.all([
    getSitemapPrompts().catch(() => []),
    getPopulatedCategories().catch(() => []),
  ])

  const latest = prompts.reduce<string | null>(
    (acc, p) => (!acc || p.updated_at > acc ? p.updated_at : acc),
    null,
  )

  const staticPaths = ['/', '/prompts', '/categories', '/about', '/contact', '/privacy-policy', '/terms']

  return [
    ...staticPaths.map((path) => ({
      url: absoluteUrl(path, base),
      lastModified: path === '/' || path === '/prompts' ? (latest ?? undefined) : undefined,
    })),
    ...categories.map((c) => ({
      url: absoluteUrl(`/categories/${c.slug}`, base),
      lastModified: c.updated_at,
    })),
    ...prompts.map((p) => ({
      url: absoluteUrl(`/prompts/${p.slug}`, base),
      lastModified: p.updated_at,
    })),
  ]
}
