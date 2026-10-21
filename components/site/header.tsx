import { getSettings } from '@/lib/data/public'
import { Logo } from './logo'
import { MobileMenu } from './mobile-menu'
import { NavLinks } from './nav-links'
import { SearchBox } from './search-box'
import { ThemeToggle } from './theme-toggle'

export async function Header() {
  const settings = await getSettings()

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container-page relative flex h-16 items-center gap-4">
        <Logo settings={settings} />
        <nav aria-label="Primary" className="ml-6 hidden lg:block">
          <NavLinks />
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <SearchBox className="hidden w-64 lg:block xl:w-72" />
          <ThemeToggle />
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
