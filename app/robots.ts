import type { MetadataRoute } from 'next'
import { getSettings } from '@/lib/data/public'
import { absoluteUrl, getBaseUrl } from '@/lib/site'

export const revalidate = 3600

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings()
  const base = getBaseUrl(settings)

  if (!settings.allow_indexing) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    ...(settings.sitemap_enabled ? { sitemap: absoluteUrl('/sitemap.xml', base) } : {}),
  }
}
