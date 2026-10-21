'use client'

import { useActionState, useState } from 'react'
import { Field, FormMessage, Section, SubmitButton, describedBy, inputClass } from '@/components/admin/field'
import { ImageUploader } from '@/components/admin/image-uploader'
import { CheckboxField, TextAreaField, TextField } from '@/components/admin/inputs'
import { savePromptAction } from '@/lib/admin/actions'
import { slugify } from '@/lib/site'
import type { PromptRecord } from '@/lib/types'

type Props = {
  categories: { id: string; name: string }[]
  prompt?: PromptRecord
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function PromptForm({ categories, prompt }: Props) {
  const [state, action] = useActionState(savePromptAction, {})
  const fe = state.fieldErrors ?? {}
  const v = state.values ?? {}
  const pick = (key: string, fallback: string | null | undefined) => v[key] ?? fallback ?? ''

  const [title, setTitle] = useState(prompt?.title ?? '')
  const [slug, setSlug] = useState(prompt?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(prompt))
  const [image, setImage] = useState({
    url: prompt?.featured_image_url ?? '',
    width: prompt?.image_width ?? null,
    height: prompt?.image_height ?? null,
  })
  const [alt, setAlt] = useState(prompt?.featured_image_alt ?? '')
  const [publishedLocal, setPublishedLocal] = useState(toLocalInput(prompt?.published_at))

  const publishedIso = (() => {
    if (!publishedLocal) return ''
    const d = new Date(publishedLocal)
    return Number.isNaN(d.getTime()) ? '' : d.toISOString()
  })()

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      {prompt ? <input type="hidden" name="id" value={prompt.id} /> : null}
      <input type="hidden" name="featured_image_url" value={image.url} />
      <input type="hidden" name="image_width" value={image.width ?? ''} />
      <input type="hidden" name="image_height" value={image.height ?? ''} />
      <input type="hidden" name="published_at" value={publishedIso} />

      <div className="space-y-6">
        <FormMessage state={state} />

        <Section title="Content">
          <Field label="Title" htmlFor="title" error={fe.title}>
            <input
              id="title"
              name="title"
              required
              maxLength={140}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (!slugTouched) setSlug(slugify(e.target.value))
              }}
              aria-invalid={Boolean(fe.title)}
              aria-describedby={describedBy('title', undefined, fe.title)}
              className={inputClass}
            />
          </Field>
          <Field
            label="URL slug"
            htmlFor="slug"
            hint={`Appears at /prompts/${slug || 'your-slug'}. Changing it keeps the old link redirecting.`}
            error={fe.slug}
          >
            <input
              id="slug"
              name="slug"
              maxLength={120}
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
              aria-invalid={Boolean(fe.slug)}
              aria-describedby={describedBy('slug', 'hint', fe.slug)}
              className={`${inputClass} font-mono text-[13px]`}
            />
          </Field>
          <TextAreaField
            name="prompt_text"
            label="Prompt"
            rows={10}
            maxLength={8000}
            required
            mono
            defaultValue={pick('prompt_text', prompt?.prompt_text)}
            error={fe.prompt_text}
            hint="The full text visitors will copy."
          />
          <TextAreaField
            name="excerpt"
            label="Excerpt"
            rows={3}
            maxLength={400}
            defaultValue={pick('excerpt', prompt?.excerpt)}
            error={fe.excerpt}
            hint="A short summary shown on cards and used as the default meta description."
          />
        </Section>

        <Section title="Featured image" description="Shown on cards, the prompt page and social previews.">
          <ImageUploader
            label="Image"
            folder="prompts"
            value={image.url || null}
            error={fe.featured_image_url}
            hint="JPEG, PNG, WebP or AVIF, up to 8 MB."
            onChange={(img) =>
              setImage(img ? { url: img.url, width: img.width, height: img.height } : { url: '', width: null, height: null })
            }
          />
          <Field
            label="Alt text"
            htmlFor="featured_image_alt"
            hint="Describe the image for people using screen readers. Required when an image is set."
            error={fe.featured_image_alt}
          >
            <input
              id="featured_image_alt"
              name="featured_image_alt"
              maxLength={300}
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              aria-invalid={Boolean(fe.featured_image_alt)}
              aria-describedby={describedBy('featured_image_alt', 'hint', fe.featured_image_alt)}
              className={inputClass}
            />
          </Field>
        </Section>

        <Section title="Search appearance" description="Leave blank to use the title and excerpt.">
          <TextField
            name="seo_title"
            label="SEO title"
            maxLength={120}
            defaultValue={pick('seo_title', prompt?.seo_title)}
            error={fe.seo_title}
          />
          <TextAreaField
            name="seo_description"
            label="Meta description"
            rows={3}
            maxLength={320}
            defaultValue={pick('seo_description', prompt?.seo_description)}
            error={fe.seo_description}
          />
          <TextField
            name="canonical_url"
            label="Canonical URL"
            type="url"
            inputMode="url"
            placeholder="https://"
            defaultValue={pick('canonical_url', prompt?.canonical_url)}
            error={fe.canonical_url}
            hint="Only set this if the prompt was first published elsewhere."
          />
        </Section>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
        <Section title="Publishing">
          <Field label="Status" htmlFor="status">
            <select id="status" name="status" defaultValue={pick('status', prompt?.status ?? 'draft')} className={inputClass}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </Field>
          <Field
            label="Publish date"
            htmlFor="published_at_local"
            hint="Leave blank to publish now. A future date schedules the prompt."
            error={fe.published_at}
          >
            <input
              id="published_at_local"
              type="datetime-local"
              value={publishedLocal}
              onChange={(e) => setPublishedLocal(e.target.value)}
              aria-invalid={Boolean(fe.published_at)}
              className={inputClass}
            />
          </Field>
          <CheckboxField
            name="featured"
            label="Feature on the home page"
            defaultChecked={v.featured !== undefined ? v.featured === 'on' : prompt?.featured}
          />
          <SubmitButton className="w-full">Save prompt</SubmitButton>
        </Section>

        <Section title="Organization">
          <Field label="Category" htmlFor="category_id" error={fe.category_id}>
            <select
              id="category_id"
              name="category_id"
              required
              defaultValue={pick('category_id', prompt?.category_id)}
              aria-invalid={Boolean(fe.category_id)}
              className={inputClass}
            >
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <TextField
            name="tags"
            label="Tags"
            defaultValue={pick('tags', prompt?.tags.join(', '))}
            error={fe.tags}
            hint="Separate with commas. Up to 15."
          />
        </Section>
      </aside>
    </form>
  )
}
