import { cache } from 'react'
import { createPublicClient, createUncachedPublicClient } from '@/lib/supabase/public'
import {
  DEFAULT_SETTINGS,
  PAGE_SIZE,
  type Category,
  type PromptCardData,
  type PromptRecord,
  type SiteSettings,
} from '@/lib/types'

const CARD_COLUMNS =
  'id,title,slug,excerpt,featured_image_url,featured_image_alt,image_width,image_height,tags,published_at,categories!inner(name,slug)'

type CardRow = Omit<PromptCardData, 'category_name' | 'category_slug'> & {
  categories: { name: string; slug: string } | { name: string; slug: string }[]
}

function toCard(row: CardRow): PromptCardData {
  const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories
  const { categories: _ignored, ...rest } = row
  return { ...rest, category_name: cat.name, category_slug: cat.slug }
}

export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const { data, error } = await createPublicClient()
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
    if (error || !data) return DEFAULT_SETTINGS
    return data as SiteSettings
  } catch {
    return DEFAULT_SETTINGS
  }
})

export const getCategories = cache(async (): Promise<Category[]> => {
  const { data, error } = await createPublicClient()
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw new Error('Failed to load categories')
  return (data ?? []) as Category[]
})

export const getCategoryCounts = cache(async (): Promise<Record<string, number>> => {
  const { data, error } = await createPublicClient().rpc('category_prompt_counts')
  if (error) throw new Error('Failed to load category counts')
  const counts: Record<string, number> = {}
  for (const row of (data ?? []) as { category_id: string; prompt_count: number }[]) {
    counts[row.category_id] = Number(row.prompt_count)
  }
  return counts
})

/** Categories that currently contain at least one live prompt. */
export const getPopulatedCategories = cache(
  async (): Promise<(Category & { prompt_count: number })[]> => {
    const [categories, counts] = await Promise.all([getCategories(), getCategoryCounts()])
    return categories
      .filter((c) => (counts[c.id] ?? 0) > 0)
      .map((c) => ({ ...c, prompt_count: counts[c.id] }))
  },
)

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  const { data, error } = await createPublicClient()
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw new Error('Failed to load category')
  return (data as Category | null) ?? null
})

export const getFeaturedPrompts = cache(async (limit = 6): Promise<PromptCardData[]> => {
  const { data, error } = await createPublicClient()
    .from('prompts')
    .select(CARD_COLUMNS)
    .eq('featured', true)
    .order('published_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error('Failed to load featured prompts')
  return ((data ?? []) as unknown as CardRow[]).map(toCard)
})

export type PromptPage = { items: PromptCardData[]; total: number }

export type SearchParams = {
  q?: string | null
  category?: string | null
  tag?: string | null
  sort?: 'relevance' | 'newest' | 'oldest' | 'title'
  page?: number
  pageSize?: number
}

async function runSearch(
  client: ReturnType<typeof createPublicClient>,
  { q, category, tag, sort = 'newest', page = 1, pageSize = PAGE_SIZE }: SearchParams,
): Promise<PromptPage> {
  const { data, error } = await client.rpc('search_prompts', {
    p_q: q || null,
    p_category: category || null,
    p_tag: tag || null,
    p_sort: sort,
    p_limit: pageSize,
    p_offset: (Math.max(page, 1) - 1) * pageSize,
  })
  if (error) throw new Error('Search failed')
  const rows = (data ?? []) as (PromptCardData & { total_count: number })[]
  return {
    items: rows.map(({ total_count: _t, ...card }) => card),
    total: rows.length ? Number(rows[0].total_count) : 0,
  }
}

export const getPromptPage = cache(
  async (page: number, category?: string | null): Promise<PromptPage> =>
    runSearch(createPublicClient(), { page, category, sort: 'newest' }),
)

export async function searchPrompts(params: SearchParams): Promise<PromptPage> {
  return runSearch(createUncachedPublicClient(), params)
}

export const getTags = cache(async (limit = 24): Promise<{ tag: string; prompt_count: number }[]> => {
  const { data, error } = await createPublicClient().rpc('list_tags', { p_limit: limit })
  if (error) throw new Error('Failed to load tags')
  return ((data ?? []) as { tag: string; prompt_count: number }[]).map((r) => ({
    tag: r.tag,
    prompt_count: Number(r.prompt_count),
  }))
})

export type PublicPrompt = PromptRecord & {
  categories: { id: string; name: string; slug: string; description: string }
}

export const getPromptBySlug = cache(async (slug: string): Promise<PublicPrompt | null> => {
  const { data, error } = await createPublicClient()
    .from('prompts')
    .select('*, categories!inner(id,name,slug,description)')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw new Error('Failed to load prompt')
  return (data as unknown as PublicPrompt | null) ?? null
})

export const getRelatedPrompts = cache(async (id: string, limit = 3): Promise<PromptCardData[]> => {
  const { data, error } = await createPublicClient().rpc('related_prompts', {
    p_id: id,
    p_limit: limit,
  })
  if (error) throw new Error('Failed to load related prompts')
  return (data ?? []) as PromptCardData[]
})

export async function findRedirect(
  kind: 'prompt' | 'category',
  oldSlug: string,
): Promise<string | null> {
  const select =
    kind === 'prompt'
      ? 'prompts(slug,status,published_at)'
      : 'categories(slug)'
  const { data, error } = await createPublicClient()
    .from('slug_redirects')
    .select(select)
    .eq('kind', kind)
    .eq('old_slug', oldSlug)
    .maybeSingle()
  if (error || !data) return null
  const row = data as unknown as Record<string, { slug: string } | { slug: string }[] | null>
  const target = kind === 'prompt' ? row.prompts : row.categories
  const resolved = Array.isArray(target) ? target[0] : target
  return resolved?.slug ?? null
}

export async function getSitemapPrompts(): Promise<{ slug: string; updated_at: string }[]> {
  const client = createPublicClient()
  const out: { slug: string; updated_at: string }[] = []
  const step = 1000
  for (let from = 0; from < 50000; from += step) {
    const { data, error } = await client
      .from('prompts')
      .select('slug,updated_at')
      .order('published_at', { ascending: false })
      .range(from, from + step - 1)
    if (error) throw new Error('Failed to load sitemap prompts')
    out.push(...((data ?? []) as { slug: string; updated_at: string }[]))
    if (!data || data.length < step) break
  }
  return out
}
