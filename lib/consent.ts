'use client'

import { useSyncExternalStore } from 'react'

const KEY = 'promptavero-consent'
export type Consent = 'granted' | 'denied' | null

const listeners = new Set<() => void>()

function read(): Consent {
  try {
    const value = window.localStorage.getItem(KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

export function setConsent(value: Exclude<Consent, null>) {
  try {
    window.localStorage.setItem(KEY, value)
  } catch {
    // Storage may be blocked; the choice then only lasts for this page view.
  }
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  window.addEventListener('storage', cb)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', cb)
  }
}

/** `undefined` during server render and hydration, then the stored choice. */
export function useConsent(): Consent | undefined {
  return useSyncExternalStore<Consent | undefined>(subscribe, read, () => undefined)
}
