import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Props = {
  page: number
  totalPages: number
  /** Builds the href for a page number; page 1 should omit the page parameter. */
  hrefFor: (page: number) => string
}

function pageWindow(page: number, total: number): (number | 'gap')[] {
  const pages = new Set([1, total, page - 1, page, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap')
    out.push(p)
  })
  return out
}

export function Pagination({ page, totalPages, hrefFor }: Props) {
  if (totalPages <= 1) return null
  const itemClass =
    'inline-flex h-10 min-w-10 items-center justify-center rounded-lg border border-border px-3 text-sm transition-colors hover:bg-muted'

  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={cn(itemClass, 'gap-1')}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          Previous
        </Link>
      ) : null}
      {pageWindow(page, totalPages).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className={cn(itemClass, p === page && 'border-foreground bg-foreground text-background hover:bg-foreground')}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={cn(itemClass, 'gap-1')}>
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  )
}
