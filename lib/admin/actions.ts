'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertAdmin, getAdminContext } from '@/lib/admin/auth'
import {
  checked,
  echoValues,
  isEmail,
  isHttpUrl,
  parsePositiveInt,
  parseTags,
  safeAdminPath,
  text,
  textOrNull,
  type ActionState,
} from '@/lib/admin/validate'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { slugify } from '@/lib/site'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { CONTENT_TAG } from '@/lib/supabase/public'

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function refreshPublicContent() {
  updateTag(CONTENT_TAG)
  revalidatePath('/', 'layout')
}

function unauthorized(): ActionState {
  return { error: 'Your session has expired. Please sign in again.' }
}

/* ------------------------------ Authentication ------------------------------ */

export async function signInAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const ip = await clientIp()
  const limit = rateLimit(`login:${ip}`, 8, 10 * 60 * 1000)
  if (!limit.ok) return { error: `Too many attempts. Try again in ${limit.retryAfter} seconds.` }

  const email = text(fd, 'email').toLowerCase()
  const password = typeof fd.get('password') === 'string' ? (fd.get('password') as string) : ''
  if (!isEmail(email) || !password) return { error: 'Enter your email and password.', values: { email } }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.code === 'email_not_confirmed') {
      return { error: 'Confirm your email address before signing in.', values: { email } }
    }
    if (error.status === 429) {
      return { error: 'Too many attempts. Please wait a moment and try again.', values: { email } }
    }
    if (error.status && error.status >= 500) {
      return { error: 'Sign in is unavailable right now. Please try again shortly.', values: { email } }
    }
    return { error: 'Invalid email or password.', values: { email } }
  }

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin !== true) {
    await supabase.auth.signOut()
    return { error: 'Invalid email or password.', values: { email } }
  }

  redirect(safeAdminPath(text(fd, 'next')))
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

export async function setupAdminAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const ip = await clientIp()
  const limit = rateLimit(`setup:${ip}`, 5, 60 * 60 * 1000)
  if (!limit.ok) return { error: `Too many attempts. Try again in ${limit.retryAfter} seconds.` }

  const email = text(fd, 'email').toLowerCase()
  const password = typeof fd.get('password') === 'string' ? (fd.get('password') as string) : ''
  const fieldErrors: Record<string, string> = {}
  if (!isEmail(email)) fieldErrors.email = 'Enter a valid email address.'
  if (password.length < 10) fieldErrors.password = 'Use at least 10 characters.'
  if (password.length > 128) fieldErrors.password = 'Use 128 characters or fewer.'
  if (Object.keys(fieldErrors).length) return { fieldErrors, values: { email } }

  const requiredCode = process.env.ADMIN_SETUP_CODE
  if (requiredCode && text(fd, 'setup_code') !== requiredCode) {
    return { fieldErrors: { setup_code: 'That setup code is not correct.' }, values: { email } }
  }

  const service = createServiceClient()
  const { count, error: countError } = await service
    .from('admin_users')
    .select('user_id', { count: 'exact', head: true })
  if (countError) return { error: 'Setup is unavailable right now. Please try again.', values: { email } }
  if ((count ?? 0) > 0) return { error: 'An administrator already exists. Sign in instead.' }

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createError || !created.user) {
    return {
      error: 'Could not create the account. Check the email address and try again.',
      values: { email },
    }
  }

  const { data: claimed, error: claimError } = await service.rpc('bootstrap_admin', {
    p_user_id: created.user.id,
  })
  if (claimError || claimed !== true) {
    await service.auth.admin.deleteUser(created.user.id)
    return { error: 'An administrator already exists. Sign in instead.' }
  }

  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) redirect('/admin/login')
  redirect('/admin')
}

/* --------------------------------- Prompts --------------------------------- */

export async function savePromptAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const values = echoValues(fd)
  let ctx
  try {
    ctx = await assertAdmin()
  } catch {
    return { ...unauthorized(), values }
  }

  const id = text(fd, 'id')
  const title = text(fd, 'title')
  const slug = text(fd, 'slug') || slugify(title)
  const promptText = text(fd, 'prompt_text')
  const excerpt = text(fd, 'excerpt')
  const categoryId = text(fd, 'category_id')
  const imageUrl = textOrNull(fd, 'featured_image_url')
  const imageAlt = textOrNull(fd, 'featured_image_alt')
  const tags = parseTags(text(fd, 'tags'))
  const status = text(fd, 'status') === 'published' ? 'published' : 'draft'
  const publishedRaw = text(fd, 'published_at')
  const seoTitle = textOrNull(fd, 'seo_title')
  const seoDescription = textOrNull(fd, 'seo_description')
  const canonical = textOrNull(fd, 'canonical_url')

  const fieldErrors: Record<string, string> = {}
  if (title.length < 3 || title.length > 140) fieldErrors.title = 'Title must be 3 to 140 characters.'
  if (!slug || !SLUG_PATTERN.test(slug) || slug.length > 120) {
    fieldErrors.slug = 'Use lowercase letters, numbers and single hyphens (up to 120 characters).'
  }
  if (promptText.length < 10) fieldErrors.prompt_text = 'The prompt must be at least 10 characters.'
  if (promptText.length > 8000) fieldErrors.prompt_text = 'The prompt must be 8000 characters or fewer.'
  if (excerpt.length > 400) fieldErrors.excerpt = 'Keep the excerpt to 400 characters or fewer.'
  if (!UUID_PATTERN.test(categoryId)) fieldErrors.category_id = 'Choose a category.'
  if (imageUrl && !isHttpUrl(imageUrl)) fieldErrors.featured_image_url = 'Enter a valid image URL.'
  if (imageUrl && !imageAlt) fieldErrors.featured_image_alt = 'Alt text is required when there is an image.'
  if (imageAlt && imageAlt.length > 300) fieldErrors.featured_image_alt = 'Keep alt text to 300 characters or fewer.'
  if (tags.length > 15) fieldErrors.tags = 'Use 15 tags or fewer.'
  if (tags.some((t) => t.length > 40)) fieldErrors.tags = 'Each tag must be 40 characters or fewer.'
  if (seoTitle && seoTitle.length > 120) fieldErrors.seo_title = 'Keep the SEO title to 120 characters or fewer.'
  if (seoDescription && seoDescription.length > 320) {
    fieldErrors.seo_description = 'Keep the SEO description to 320 characters or fewer.'
  }
  if (canonical && !isHttpUrl(canonical)) fieldErrors.canonical_url = 'Enter a valid URL.'

  let publishedAt: string | null = null
  if (publishedRaw) {
    const d = new Date(publishedRaw)
    if (Number.isNaN(d.getTime())) fieldErrors.published_at = 'Enter a valid date and time.'
    else publishedAt = d.toISOString()
  }

  if (id && !UUID_PATTERN.test(id)) return { error: 'This prompt could not be found.', values }
  if (Object.keys(fieldErrors).length) {
    return { error: 'Please fix the highlighted fields.', fieldErrors, values }
  }

  const payload = {
    title,
    slug,
    prompt_text: promptText,
    excerpt,
    category_id: categoryId,
    featured_image_url: imageUrl,
    featured_image_alt: imageUrl ? imageAlt : null,
    image_width: imageUrl ? parsePositiveInt(text(fd, 'image_width')) : null,
    image_height: imageUrl ? parsePositiveInt(text(fd, 'image_height')) : null,
    tags,
    status,
    featured: checked(fd, 'featured'),
    published_at: publishedAt,
    seo_title: seoTitle,
    seo_description: seoDescription,
    canonical_url: canonical,
  }

  const query = id
    ? ctx.supabase.from('prompts').update(payload).eq('id', id).select('id').maybeSingle()
    : ctx.supabase
        .from('prompts')
        .insert({ ...payload, author_id: ctx.user.id })
        .select('id')
        .single()
  const { data, error } = await query

  if (error) {
    if (error.code === '23505') {
      return {
        error: 'Please fix the highlighted fields.',
        fieldErrors: { slug: 'Another prompt already uses this slug.' },
        values,
      }
    }
    if (error.code === '42501') return { ...unauthorized(), values }
    return { error: 'The prompt could not be saved. Please try again.', values }
  }
  if (!data) return { error: 'This prompt no longer exists.', values }

  refreshPublicContent()
  if (!id) redirect(`/admin/prompts/${data.id}?created=1`)
  return { ok: true, message: 'Prompt saved.', values }
}

export async function deletePromptAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  let ctx
  try {
    ctx = await assertAdmin()
  } catch {
    return unauthorized()
  }
  const id = text(fd, 'id')
  if (!UUID_PATTERN.test(id)) return { error: 'This prompt could not be found.' }

  const { error } = await ctx.supabase.from('prompts').delete().eq('id', id)
  if (error) return { error: 'The prompt could not be deleted. Please try again.' }

  refreshPublicContent()
  redirect('/admin/prompts?deleted=1')
}

/* -------------------------------- Categories -------------------------------- */

export async function saveCategoryAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const values = echoValues(fd)
  let ctx
  try {
    ctx = await assertAdmin()
  } catch {
    return { ...unauthorized(), values }
  }

  const id = text(fd, 'id')
  const name = text(fd, 'name')
  const slug = text(fd, 'slug') || slugify(name)
  const description = text(fd, 'description')
  const seoTitle = textOrNull(fd, 'seo_title')
  const seoDescription = textOrNull(fd, 'seo_description')
  const sortRaw = text(fd, 'sort_order')
  const sortOrder = sortRaw === '' ? 0 : Number(sortRaw)

  const fieldErrors: Record<string, string> = {}
  if (name.length < 2 || name.length > 80) fieldErrors.name = 'Name must be 2 to 80 characters.'
  if (!slug || !SLUG_PATTERN.test(slug) || slug.length > 80) {
    fieldErrors.slug = 'Use lowercase letters, numbers and single hyphens (up to 80 characters).'
  }
  if (description.length > 1000) fieldErrors.description = 'Keep the description to 1000 characters or fewer.'
  if (seoTitle && seoTitle.length > 120) fieldErrors.seo_title = 'Keep the SEO title to 120 characters or fewer.'
  if (seoDescription && seoDescription.length > 320) {
    fieldErrors.seo_description = 'Keep the SEO description to 320 characters or fewer.'
  }
  if (!Number.isInteger(sortOrder) || Math.abs(sortOrder) > 100000) {
    fieldErrors.sort_order = 'Enter a whole number.'
  }
  if (id && !UUID_PATTERN.test(id)) return { error: 'This category could not be found.', values }
  if (Object.keys(fieldErrors).length) {
    return { error: 'Please fix the highlighted fields.', fieldErrors, values }
  }

  const payload = {
    name,
    slug,
    description,
    seo_title: seoTitle,
    seo_description: seoDescription,
    sort_order: sortOrder,
  }
  const query = id
    ? ctx.supabase.from('categories').update(payload).eq('id', id).select('id').maybeSingle()
    : ctx.supabase.from('categories').insert(payload).select('id').single()
  const { data, error } = await query

  if (error) {
    if (error.code === '23505') {
      const nameClash = error.message.includes('name')
      return {
        error: 'Please fix the highlighted fields.',
        fieldErrors: nameClash
          ? { name: 'A category with this name already exists.' }
          : { slug: 'Another category already uses this slug.' },
        values,
      }
    }
    if (error.code === '42501') return { ...unauthorized(), values }
    return { error: 'The category could not be saved. Please try again.', values }
  }
  if (!data) return { error: 'This category no longer exists.', values }

  refreshPublicContent()
  if (!id) redirect('/admin/categories?created=1')
  return { ok: true, message: 'Category saved.', values }
}

export async function deleteCategoryAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  let ctx
  try {
    ctx = await assertAdmin()
  } catch {
    return unauthorized()
  }
  const id = text(fd, 'id')
  if (!UUID_PATTERN.test(id)) return { error: 'This category could not be found.' }

  const { error } = await ctx.supabase.from('categories').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      return { error: 'This category still has prompts. Move or delete them first.' }
    }
    return { error: 'The category could not be deleted. Please try again.' }
  }

  refreshPublicContent()
  redirect('/admin/categories?deleted=1')
}

/* --------------------------------- Settings --------------------------------- */

export async function saveSettingsAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const values = echoValues(fd)
  let ctx
  try {
    ctx = await assertAdmin()
  } catch {
    return { ...unauthorized(), values }
  }

  const siteName = text(fd, 'site_name')
  const tagline = text(fd, 'tagline')
  const defaultTitle = text(fd, 'default_seo_title')
  const defaultDescription = text(fd, 'default_seo_description')
  const siteUrlRaw = text(fd, 'site_url').replace(/\/+$/, '')
  const domainRaw = text(fd, 'custom_domain')
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '')
  const contactEmail = textOrNull(fd, 'contact_email')
  const contactDetails = textOrNull(fd, 'contact_details')
  const gaId = textOrNull(fd, 'google_analytics_id')
  const adsenseId = textOrNull(fd, 'adsense_client_id')
  const slotListing = textOrNull(fd, 'ad_slot_listing')
  const slotPrompt = textOrNull(fd, 'ad_slot_prompt')
  const adsEnabled = checked(fd, 'ads_enabled')
  const socials = ['x_url', 'instagram_url', 'youtube_url', 'pinterest_url'] as const
  const imageFields = ['logo_url', 'favicon_url', 'default_og_image_url'] as const

  const fieldErrors: Record<string, string> = {}
  if (siteName.length < 1 || siteName.length > 60) fieldErrors.site_name = 'Site name must be 1 to 60 characters.'
  if (tagline.length > 160) fieldErrors.tagline = 'Keep the tagline to 160 characters or fewer.'
  if (defaultTitle.length < 1 || defaultTitle.length > 120) {
    fieldErrors.default_seo_title = 'Default SEO title must be 1 to 120 characters.'
  }
  if (defaultDescription.length < 1 || defaultDescription.length > 320) {
    fieldErrors.default_seo_description = 'Default SEO description must be 1 to 320 characters.'
  }
  if (siteUrlRaw && (!isHttpUrl(siteUrlRaw) || new URL(siteUrlRaw).pathname !== '/')) {
    fieldErrors.site_url = 'Enter an origin such as https://promptavero.com with no path.'
  }
  if (domainRaw && !/^(?=.{1,253}$)([a-z0-9-]+\.)+[a-z]{2,}$/i.test(domainRaw)) {
    fieldErrors.custom_domain = 'Enter a domain such as promptavero.com.'
  }
  if (contactEmail && !isEmail(contactEmail)) fieldErrors.contact_email = 'Enter a valid email address.'
  if (contactDetails && contactDetails.length > 1000) {
    fieldErrors.contact_details = 'Keep contact details to 1000 characters or fewer.'
  }
  if (gaId && !/^G-[A-Z0-9]+$/.test(gaId)) fieldErrors.google_analytics_id = 'Use the format G-XXXXXXXXXX.'
  if (adsenseId && !/^ca-pub-\d+$/.test(adsenseId)) {
    fieldErrors.adsense_client_id = 'Use the format ca-pub-1234567890123456.'
  }
  if (slotListing && !/^\d+$/.test(slotListing)) fieldErrors.ad_slot_listing = 'Ad slot IDs are numbers only.'
  if (slotPrompt && !/^\d+$/.test(slotPrompt)) fieldErrors.ad_slot_prompt = 'Ad slot IDs are numbers only.'
  if (adsEnabled && !adsenseId) fieldErrors.adsense_client_id = 'Add your AdSense publisher ID to enable ads.'

  const socialValues: Record<string, string | null> = {}
  for (const key of socials) {
    const v = textOrNull(fd, key)
    if (v && !isHttpUrl(v)) fieldErrors[key] = 'Enter a full URL starting with https://.'
    socialValues[key] = v
  }
  const imageValues: Record<string, string | null> = {}
  for (const key of imageFields) {
    const v = textOrNull(fd, key)
    if (v && !isHttpUrl(v)) fieldErrors[key] = 'Enter a valid image URL.'
    imageValues[key] = v
  }

  if (Object.keys(fieldErrors).length) {
    return { error: 'Please fix the highlighted fields.', fieldErrors, values }
  }

  const { error } = await ctx.supabase
    .from('site_settings')
    .update({
      site_name: siteName,
      tagline,
      default_seo_title: defaultTitle,
      default_seo_description: defaultDescription,
      site_url: siteUrlRaw || null,
      custom_domain: domainRaw || null,
      contact_email: contactEmail,
      contact_details: contactDetails,
      google_analytics_id: gaId,
      google_site_verification: textOrNull(fd, 'google_site_verification'),
      bing_site_verification: textOrNull(fd, 'bing_site_verification'),
      allow_indexing: checked(fd, 'allow_indexing'),
      sitemap_enabled: checked(fd, 'sitemap_enabled'),
      ads_enabled: adsEnabled,
      adsense_client_id: adsenseId,
      ad_slot_listing: slotListing,
      ad_slot_prompt: slotPrompt,
      ...socialValues,
      ...imageValues,
    })
    .eq('id', 1)

  if (error) {
    if (error.code === '42501') return { ...unauthorized(), values }
    return { error: 'Settings could not be saved. Please try again.', values }
  }

  refreshPublicContent()
  return { ok: true, message: 'Settings saved.', values }
}

export async function adminSessionActive(): Promise<boolean> {
  return (await getAdminContext()) !== null
}
