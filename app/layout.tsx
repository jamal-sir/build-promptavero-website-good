import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ConsentBanner } from '@/components/site/consent-banner'
import { getSettings } from '@/lib/data/public'
import { getBaseUrl } from '@/lib/site'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans', display: 'swap' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' })

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings()
  return {
    metadataBase: new URL(getBaseUrl(s)),
    title: { default: s.default_seo_title, template: `%s | ${s.site_name}` },
    description: s.default_seo_description,
    applicationName: s.site_name,
    robots: s.allow_indexing
      ? { index: true, follow: true }
      : { index: false, follow: false },
    verification: {
      google: s.google_site_verification ?? undefined,
      other: s.bing_site_verification ? { 'msvalidate.01': s.bing_site_verification } : undefined,
    },
    icons: s.favicon_url
      ? { icon: s.favicon_url }
      : {
          icon: [
            { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
            { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
            { url: '/icon.svg', type: 'image/svg+xml' },
          ],
          apple: '/apple-icon.png',
        },
    openGraph: {
      siteName: s.site_name,
      type: 'website',
      locale: 'en_US',
      ...(s.default_og_image_url ? { images: [{ url: s.default_og_image_url }] } : {}),
    },
    twitter: { card: s.default_og_image_url ? 'summary_large_image' : 'summary' },
  }
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfaf8' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0e' },
  ],
}

const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()
  const adsenseId = settings.ads_enabled ? settings.adsense_client_id : null

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        {children}
        <ConsentBanner gaId={settings.google_analytics_id} adsenseId={adsenseId} />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
