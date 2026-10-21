import Link from 'next/link'
import { getPopulatedCategories, getSettings } from '@/lib/data/public'
import { Logo } from './logo'

export async function Footer() {
  const [settings, categories] = await Promise.all([
    getSettings(),
    getPopulatedCategories().catch(() => []),
  ])

  const socials = [
    { label: 'X', href: settings.x_url },
    { label: 'Instagram', href: settings.instagram_url },
    { label: 'YouTube', href: settings.youtube_url },
    { label: 'Pinterest', href: settings.pinterest_url },
  ].filter((s): s is { label: string; href: string } => Boolean(s.href))

  const linkClass = 'text-sm text-muted-foreground transition-colors hover:text-foreground'

  return (
    <footer className="mt-24 border-t border-border">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-xs space-y-4">
          <Logo settings={settings} />
          <p className="text-sm leading-relaxed text-muted-foreground">{settings.tagline}.</p>
          {socials.length ? (
            <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Social links">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} rel="noopener noreferrer me" target="_blank" className={linkClass}>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <nav aria-label="Explore">
          <h2 className="eyebrow mb-4">Explore</h2>
          <ul className="space-y-2.5">
            <li><Link href="/" className={linkClass}>Home</Link></li>
            <li><Link href="/prompts" className={linkClass}>Explore Prompts</Link></li>
            <li><Link href="/categories" className={linkClass}>Categories</Link></li>
            <li><Link href="/search" className={linkClass}>Search</Link></li>
          </ul>
        </nav>

        <nav aria-label="Categories">
          <h2 className="eyebrow mb-4">Categories</h2>
          {categories.length ? (
            <ul className="space-y-2.5">
              {categories.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href={`/categories/${c.slug}`} className={linkClass}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Categories appear once prompts are published.</p>
          )}
        </nav>

        <nav aria-label="Company">
          <h2 className="eyebrow mb-4">Company</h2>
          <ul className="space-y-2.5">
            <li><Link href="/about" className={linkClass}>About</Link></li>
            <li><Link href="/contact" className={linkClass}>Contact</Link></li>
            <li><Link href="/privacy-policy" className={linkClass}>Privacy Policy</Link></li>
            <li><Link href="/terms" className={linkClass}>Terms of Service</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {settings.site_name}. All rights reserved.</p>
          <p>Prompts are provided as creative starting points; results vary by AI model.</p>
        </div>
      </div>
    </footer>
  )
}
