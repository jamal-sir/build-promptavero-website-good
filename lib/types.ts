export type Category = {
  id: string
  name: string
  slug: string
  description: string
  seo_title: string | null
  seo_description: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type PromptCardData = {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image_url: string | null
  featured_image_alt: string | null
  image_width: number | null
  image_height: number | null
  tags: string[]
  published_at: string | null
  category_name: string
  category_slug: string
}

export type PromptRecord = {
  id: string
  title: string
  slug: string
  prompt_text: string
  excerpt: string
  category_id: string
  featured_image_url: string | null
  featured_image_alt: string | null
  image_width: number | null
  image_height: number | null
  tags: string[]
  status: 'draft' | 'published'
  featured: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  seo_title: string | null
  seo_description: string | null
  canonical_url: string | null
  author_id: string | null
  categories?: { name: string; slug: string } | null
}

export type SiteSettings = {
  id: number
  site_name: string
  tagline: string
  logo_url: string | null
  favicon_url: string | null
  default_seo_title: string
  default_seo_description: string
  default_og_image_url: string | null
  site_url: string | null
  custom_domain: string | null
  x_url: string | null
  instagram_url: string | null
  youtube_url: string | null
  pinterest_url: string | null
  contact_email: string | null
  contact_details: string | null
  google_analytics_id: string | null
  google_site_verification: string | null
  bing_site_verification: string | null
  allow_indexing: boolean
  sitemap_enabled: boolean
  ads_enabled: boolean
  adsense_client_id: string | null
  ad_slot_listing: string | null
  ad_slot_prompt: string | null
  updated_at: string
}

export const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  site_name: 'PromptAvero',
  tagline: 'Curated AI image-generation prompts',
  logo_url: null,
  favicon_url: null,
  default_seo_title: 'PromptAvero | Curated AI Image Prompts',
  default_seo_description:
    'A curated library of creative, detailed AI image-generation prompts for portraits, cinematic scenes, 3D illustrations, fantasy art, product photography and more.',
  default_og_image_url: null,
  site_url: null,
  custom_domain: null,
  x_url: null,
  instagram_url: null,
  youtube_url: null,
  pinterest_url: null,
  contact_email: null,
  contact_details: null,
  google_analytics_id: null,
  google_site_verification: null,
  bing_site_verification: null,
  allow_indexing: true,
  sitemap_enabled: true,
  ads_enabled: false,
  adsense_client_id: null,
  ad_slot_listing: null,
  ad_slot_prompt: null,
  updated_at: new Date(0).toISOString(),
}

export const PAGE_SIZE = 12
