import Link from 'next/link'
import type { SiteSettings } from '@/lib/types'

const DEFAULT_BRAND: Pick<SiteSettings, 'site_name' | 'logo_url'> = { site_name: 'PromptAvero', logo_url: null }

export function Logo({ settings = DEFAULT_BRAND }: { settings?: Pick<SiteSettings, 'site_name' | 'logo_url'> }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 font-semibold tracking-tight" aria-label={`${settings.site_name} home`}>
      {settings.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={settings.logo_url} alt="" height={28} className="h-7 w-auto" />
      ) : (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="26" height="26" rx="8" className="stroke-foreground" strokeWidth="1.5" />
          <path d="M8 19.5 14 8l6 11.5" className="stroke-brand" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.5 15.5h7" className="stroke-foreground" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      <span className="text-[1.05rem]">{settings.site_name}</span>
    </Link>
  )
}
