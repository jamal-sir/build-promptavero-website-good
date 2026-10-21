export type ActionState = {
  ok?: boolean
  message?: string
  error?: string
  fieldErrors?: Record<string, string>
  values?: Record<string, string>
}

export function text(fd: FormData, key: string): string {
  const v = fd.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

export function textOrNull(fd: FormData, key: string): string | null {
  return text(fd, key) || null
}

export function checked(fd: FormData, key: string): boolean {
  return fd.get(key) === 'on'
}

/** Echoes submitted text back to the form so a failed save does not wipe the user's input. */
export function echoValues(fd: FormData, skip: string[] = []): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of fd.entries()) {
    if (typeof v === 'string' && !skip.includes(k) && !k.startsWith('$ACTION')) out[k] = v
  }
  return out
}

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function isEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)
}

export function parseTags(raw: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of raw.split(',')) {
    const tag = part.trim().toLowerCase().replace(/\s+/g, ' ')
    if (tag && !seen.has(tag)) {
      seen.add(tag)
      out.push(tag)
    }
  }
  return out
}

export function parsePositiveInt(raw: string): number | null {
  if (!raw) return null
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

export function safeAdminPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/admin') || next.startsWith('//') || next.includes('\\')) return '/admin'
  return next
}
