'use client'

import Script from 'next/script'
import { setConsent, useConsent } from '@/lib/consent'

type Props = { gaId: string | null; adsenseId: string | null }

/**
 * Renders nothing unless an analytics or ad ID is configured. Third-party
 * scripts load only after the visitor explicitly accepts.
 */
export function ConsentBanner({ gaId, adsenseId }: Props) {
  const consent = useConsent()
  if (!gaId && !adsenseId) return null

  return (
    <>
      {consent === 'granted' && gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="lazyOnload" />
          <Script id="ga-init" strategy="lazyOnload">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}
      {consent === 'granted' && adsenseId ? (
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
      ) : null}

      {consent === null ? (
        <section
          aria-label="Cookie preferences"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-xl border border-border bg-card p-4 text-sm shadow-lg sm:inset-x-auto sm:bottom-4 sm:left-4 sm:mx-0"
        >
          <p className="text-muted-foreground">
            With your permission we load {gaId ? 'analytics' : ''}
            {gaId && adsenseId ? ' and ' : ''}
            {adsenseId ? 'advertising' : ''} scripts that may set cookies. Browsing and copying prompts works
            either way. See the{' '}
            <a href="/privacy-policy" className="text-foreground underline underline-offset-4">
              Privacy Policy
            </a>
            .
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setConsent('granted')}
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => setConsent('denied')}
              className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
            >
              Decline
            </button>
          </div>
        </section>
      ) : null}
    </>
  )
}
