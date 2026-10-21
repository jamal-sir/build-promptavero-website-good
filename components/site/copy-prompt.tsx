'use client'

import { Check, Copy } from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type State = 'idle' | 'copied' | 'manual'

async function writeToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to the legacy path.
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}

export function CopyPrompt({ text }: { text: string }) {
  const [state, setState] = useState<State>('idle')
  const preRef = useRef<HTMLPreElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function selectText() {
    const node = preRef.current
    if (!node) return
    const range = document.createRange()
    range.selectNodeContents(node)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }

  async function handleCopy() {
    if (timer.current) clearTimeout(timer.current)
    const ok = await writeToClipboard(text)
    if (ok) {
      setState('copied')
      timer.current = setTimeout(() => setState('idle'), 2500)
    } else {
      selectText()
      setState('manual')
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/60 px-4 py-3">
        <h2 className="eyebrow">Prompt</h2>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors',
            state === 'copied'
              ? 'bg-success text-white dark:text-black'
              : 'bg-primary text-primary-foreground hover:opacity-90',
          )}
        >
          {state === 'copied' ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {state === 'copied' ? 'Copied' : 'Copy Prompt'}
        </button>
      </div>
      <pre
        ref={preRef}
        tabIndex={0}
        aria-label="Prompt text"
        className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words p-5 font-mono text-[0.9rem] leading-7 text-foreground"
      >
        {text}
      </pre>
      <div role="status" aria-live="polite" className="px-5 pb-4 text-sm empty:hidden">
        {state === 'copied' ? <span className="text-success">Prompt copied to your clipboard.</span> : null}
        {state === 'manual' ? (
          <span className="text-muted-foreground">
            Automatic copy is unavailable here. The prompt is selected, so press Ctrl+C (or Cmd+C) to copy it.
          </span>
        ) : null}
      </div>
    </div>
  )
}
