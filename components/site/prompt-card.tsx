import { ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { PromptCardData } from '@/lib/types'

export function PromptCard({ prompt, priority = false }: { prompt: PromptCardData; priority?: boolean }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/25">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {prompt.featured_image_url ? (
          <Image
            src={prompt.featured_image_url}
            alt={prompt.featured_image_alt || prompt.title}
            fill
            sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="hairline-grid absolute inset-0 flex items-end p-4" aria-hidden="true">
            <span className="eyebrow">{prompt.category_name}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="eyebrow text-brand">{prompt.category_name}</p>
        <h3 className="text-lg font-semibold leading-snug tracking-tight text-balance">
          <Link
            href={`/prompts/${prompt.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-offset-[-2px]"
          >
            {prompt.title}
          </Link>
        </h3>
        {prompt.excerpt ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{prompt.excerpt}</p>
        ) : null}
        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-medium text-foreground">
          View Prompt
          <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </article>
  )
}

export function PromptGrid({ prompts, priorityCount = 0 }: { prompts: PromptCardData[]; priorityCount?: number }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {prompts.map((p, i) => (
        <li key={p.id}>
          <PromptCard prompt={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  )
}
