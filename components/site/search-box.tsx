'use client'

import { Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import useSWR from 'swr'
import { cn } from '@/lib/utils'

type Suggestion = { title: string; slug: string; category_name: string }

const fetcher = async (url: string): Promise<Suggestion[]> => {
  const res = await fetch(url)
  if (!res.ok) return []
  return res.json()
}

type Props = {
  variant?: 'header' | 'hero'
  defaultValue?: string
  className?: string
  placeholder?: string
}

export function SearchBox({ variant = 'header', defaultValue = '', className, placeholder = 'Search prompts' }: Props) {
  const router = useRouter()
  const listId = useId()
  const wrapperRef = useRef<HTMLFormElement>(null)
  const [value, setValue] = useState(defaultValue)
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value.trim()), 200)
    return () => clearTimeout(t)
  }, [value])

  const { data } = useSWR(
    open && debounced.length >= 2 ? `/api/suggest?q=${encodeURIComponent(debounced)}` : null,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false },
  )
  const suggestions = data ?? []
  const showList = open && debounced.length >= 2 && suggestions.length > 0
  const total = suggestions.length + 1

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      setActive(-1)
      return
    }
    if (!showList) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % total)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i <= 0 ? total - 1 : i - 1))
    } else if (e.key === 'Enter' && active >= 0 && active < suggestions.length) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      setOpen(false)
      router.push(`/prompts/${suggestions[active].slug}`)
    }
  }

  const isHero = variant === 'hero'

  return (
    <form
      ref={wrapperRef}
      action="/search"
      method="get"
      role="search"
      className={cn('relative', className)}
      onBlur={(e) => {
        if (!wrapperRef.current?.contains(e.relatedTarget as Node)) {
          setOpen(false)
          setActive(-1)
        }
      }}
    >
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search prompts
      </label>
      <Search
        className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground', isHero ? 'left-4 size-5' : 'left-3 size-4')}
        aria-hidden="true"
      />
      <input
        id={`${listId}-input`}
        name="q"
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        maxLength={100}
        role="combobox"
        aria-expanded={showList}
        aria-controls={showList ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-opt-${active}` : undefined}
        className={cn(
          'w-full rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
          isHero ? 'h-14 pl-12 pr-28 text-base' : 'h-10 pl-9 pr-3 text-sm',
        )}
      />
      {isHero ? (
        <button
          type="submit"
          className="absolute right-2 top-1/2 inline-flex h-10 -translate-y-1/2 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Search
        </button>
      ) : null}

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-popover p-1 text-left shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li key={s.slug} id={`${listId}-opt-${i}`} role="option" aria-selected={active === i}>
              <Link
                href={`/prompts/${s.slug}`}
                onClick={() => setOpen(false)}
                className={cn('flex flex-col rounded-lg px-3 py-2 text-sm', active === i ? 'bg-muted' : 'hover:bg-muted')}
              >
                <span className="font-medium">{s.title}</span>
                <span className="text-xs text-muted-foreground">{s.category_name}</span>
              </Link>
            </li>
          ))}
          <li id={`${listId}-opt-${suggestions.length}`} role="option" aria-selected={active === suggestions.length}>
            <Link
              href={`/search?q=${encodeURIComponent(debounced)}`}
              onClick={() => setOpen(false)}
              className={cn(
                'block rounded-lg px-3 py-2 text-sm text-brand',
                active === suggestions.length ? 'bg-muted' : 'hover:bg-muted',
              )}
            >
              See all results for &ldquo;{debounced}&rdquo;
            </Link>
          </li>
        </ul>
      ) : null}
      <div className="sr-only" role="status" aria-live="polite">
        {showList ? `${suggestions.length} suggestions available` : ''}
      </div>
    </form>
  )
}
