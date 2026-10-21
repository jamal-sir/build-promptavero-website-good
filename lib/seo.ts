import type { Metadata } from 'next'
import { absoluteUrl } from './site'
import type { PromptCardData, SiteSettings } from './types'

type PageMetaInput = {
  title: string
  /** Use the title verbatim, skipping the "| Site name" template. */
  absoluteTitle?: boolean
  description: string
  path: string
  canonicalOverride?: string | null
  image?: { url: string; alt?: string | null; width?: number | null; height?: number | null } | null
  type?: 'website' | 'article'
  noindex?: boolean
  publishedTime?: string | null
  modifiedTime?: string | null
  settings: SiteSettings
}

export function buildPageMetadata({
  title,
  absoluteTitle,
  description,
  path,
  canonicalOverride,
  image,
  type = 'website',
  noindex,
  publishedTime,
  modifiedTime,
  settings,
}: PageMetaInput): Metadata {
  const canonical = canonicalOverride || path
  const ogImage =
    image?.url || settings.default_og_image_url
      ? [
          {
            url: (image?.url || settings.default_og_image_url) as string,
            alt: image?.alt ?? undefined,
            width: image?.width ?? undefined,
            height: image?.height ?? undefined,
          },
        ]
      : undefined
  const fullTitle = absoluteTitle ? title : `${title} | ${settings.site_name}`

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: settings.site_name,
      type,
      locale: 'en_US',
      ...(type === 'article' && publishedTime ? { publishedTime } : {}),
      ...(type === 'article' && modifiedTime ? { modifiedTime } : {}),
      ...(ogImage ? { images: ogImage } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: fullTitle,
      description,
      ...(ogImage ? { images: ogImage.map((i) => i.url) } : {}),
    },
  }
}

export function sameAsLinks(settings: SiteSettings): string[] {
  return [settings.x_url, settings.instagram_url, settings.youtube_url, settings.pinterest_url].filter(
    (u): u is string => Boolean(u),
  )
}

export function websiteJsonLd(settings: SiteSettings, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: settings.site_name,
    url: baseUrl,
    description: settings.default_seo_description,
    inLanguage: 'en',
  }
}

export function organizationJsonLd(settings: SiteSettings, baseUrl: string) {
  const sameAs = sameAsLinks(settings)
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.site_name,
    url: baseUrl,
    ...(settings.logo_url ? { logo: settings.logo_url } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(settings.contact_email
      ? { contactPoint: { '@type': 'ContactPoint', email: settings.contact_email, contactType: 'customer support' } }
      : {}),
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[], baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, baseUrl),
    })),
  }
}

export function collectionJsonLd(opts: {
  name: string
  description: string
  path: string
  items: PromptCardData[]
  baseUrl: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path, opts.baseUrl),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: opts.items.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: absoluteUrl(`/prompts/${p.slug}`, opts.baseUrl),
        name: p.title,
      })),
    },
  }
}

export function promptJsonLd(opts: {
  title: string
  description: string
  promptText: string
  path: string
  baseUrl: string
  imageUrl: string | null
  categoryName: string
  tags: string[]
  publishedAt: string | null
  updatedAt: string
  settings: SiteSettings
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: opts.title,
    headline: opts.title,
    description: opts.description,
    text: opts.promptText,
    url: absoluteUrl(opts.path, opts.baseUrl),
    mainEntityOfPage: absoluteUrl(opts.path, opts.baseUrl),
    genre: opts.categoryName,
    inLanguage: 'en',
    ...(opts.tags.length ? { keywords: opts.tags.join(', ') } : {}),
    ...(opts.imageUrl ? { image: opts.imageUrl } : {}),
    ...(opts.publishedAt ? { datePublished: opts.publishedAt } : {}),
    dateModified: opts.updatedAt,
    publisher: {
      '@type': 'Organization',
      name: opts.settings.site_name,
      url: opts.baseUrl,
    },
  }
}
