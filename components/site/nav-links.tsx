'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/prompts', label: 'Explore Prompts' },
  { href: '/categories', label: 'Categories' },
  { href: '/about', label: 'About' },
] as const

export function NavLinks({ orientation = 'horizontal', onNavigate }: { orientation?: 'horizontal' | 'vertical'; onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <ul className={cn('flex', orientation === 'horizontal' ? 'items-center gap-1' : 'flex-col gap-1')}>
      {NAV_ITEMS.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex items-center rounded-lg px-3 text-sm transition-colors hover:bg-muted',
                orientation === 'horizontal' ? 'h-9' : 'h-11 w-full text-base',
                active ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
