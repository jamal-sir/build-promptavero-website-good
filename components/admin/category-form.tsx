'use client'

import { useActionState, useState } from 'react'
import { Field, FormMessage, Section, SubmitButton, describedBy, inputClass } from '@/components/admin/field'
import { TextAreaField, TextField } from '@/components/admin/inputs'
import { saveCategoryAction } from '@/lib/admin/actions'
import { slugify } from '@/lib/site'
import type { Category } from '@/lib/types'

export function CategoryForm({ category }: { category?: Category }) {
  const [state, action] = useActionState(saveCategoryAction, {})
  const fe = state.fieldErrors ?? {}
  const v = state.values ?? {}
  const pick = (key: string, fallback: string | number | null | undefined) => v[key] ?? fallback ?? ''

  const [name, setName] = useState(category?.name ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(category))

  return (
    <form action={action} className="max-w-2xl space-y-6">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <FormMessage state={state} />
      <Section title="Details">
        <Field label="Name" htmlFor="name" error={fe.name}>
          <input
            id="name"
            name="name"
            required
            maxLength={80}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (!slugTouched) setSlug(slugify(e.target.value))
            }}
            aria-invalid={Boolean(fe.name)}
            aria-describedby={describedBy('name', undefined, fe.name)}
            className={inputClass}
          />
        </Field>
        <Field
          label="URL slug"
          htmlFor="slug"
          hint={`Appears at /categories/${slug || 'your-slug'}. Changing it keeps the old link redirecting.`}
          error={fe.slug}
        >
          <input
            id="slug"
            name="slug"
            maxLength={80}
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
          name="description"
          label="Description"
          rows={4}
          maxLength={1000}
          defaultValue={pick('description', category?.description) as string}
          error={fe.description}
          hint="Shown at the top of the category page."
        />
        <TextField
          name="sort_order"
          label="Sort order"
          type="number"
          inputMode="numeric"
          defaultValue={pick('sort_order', category?.sort_order ?? 0)}
          error={fe.sort_order}
          hint="Lower numbers appear first."
          className="max-w-40"
        />
      </Section>
      <Section title="Search appearance" description="Leave blank to use the name and description.">
        <TextField
          name="seo_title"
          label="SEO title"
          maxLength={120}
          defaultValue={pick('seo_title', category?.seo_title) as string}
          error={fe.seo_title}
        />
        <TextAreaField
          name="seo_description"
          label="Meta description"
          rows={3}
          maxLength={320}
          defaultValue={pick('seo_description', category?.seo_description) as string}
          error={fe.seo_description}
        />
      </Section>
      <SubmitButton>{category ? 'Save category' : 'Create category'}</SubmitButton>
    </form>
  )
}
