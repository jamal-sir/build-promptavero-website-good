'use client'

import { useEffect } from 'react'
import { useConsent } from '@/lib/consent'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

export function AdUnit({ clientId, slot }: { clientId: string; slot: string }) {
  const consent = useConsent()

  useEffect(() => {
    if (consent !== 'granted') return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // Ad blockers can throw here; the page is unaffected.
    }
  }, [consent])

  if (consent !== 'granted') return null

  return (
    <aside aria-label="Advertisement" className="my-10 min-h-[120px]">
      <p className="eyebrow mb-2 text-center">Advertisement</p>
      <ins
        className="adsbygoogle block"
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  )
}
