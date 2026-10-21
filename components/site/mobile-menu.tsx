'use client'

import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLinks } from './nav-links'
import { SearchBox } from './search-box'

export function MobileMenu() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="inline-flex size-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
      </button>
      {open ? (
        <div id="mobile-menu" className="absolute inset-x-0 top-full border-b border-border bg-background shadow-sm">
          <nav aria-label="Mobile" className="container-page flex flex-col gap-4 py-4">
            <SearchBox />
            <NavLinks orientation="vertical" onNavigate={() => setOpen(false)} />
          </nav>
        </div>
      ) : null}
    </div>
  )
}
