'use client'

import { ImageUp, Loader2, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type UploadedImage = { url: string; width: number | null; height: number | null }

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_BYTES = 8 * 1024 * 1024
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

type Props = {
  label: string
  folder: string
  value: string | null
  onChange: (image: UploadedImage | null) => void
  hint?: string
  error?: string
}

async function readDimensions(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(file)
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return size
  } catch {
    return null
  }
}

export function ImageUploader({ label, folder, value, onChange, hint, error }: Props) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setProblem(null)
    if (!ACCEPTED.includes(file.type)) {
      setProblem('Use a JPEG, PNG, WebP or AVIF image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setProblem('Images must be 8 MB or smaller.')
      return
    }

    setBusy(true)
    try {
      const dims = await readDimensions(file)
      const supabase = createClient()
      const path = `${folder}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`
      const { error: uploadError } = await supabase.storage.from('prompt-images').upload(path, file, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      })
      if (uploadError) {
        setProblem('The upload failed. Check that you are signed in and try again.')
        return
      }
      const { data } = supabase.storage.from('prompt-images').getPublicUrl(path)
      onChange({ url: data.publicUrl, width: dims?.width ?? null, height: dims?.height ?? null })
    } catch {
      setProblem('The upload failed. Please try again.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const message = error || problem

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {value ? (
        <div className="flex items-start gap-4 rounded-lg border border-border bg-muted/40 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary stored URL */}
          <img src={value} alt="" className="h-24 w-24 shrink-0 rounded-md border border-border object-cover" />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="break-all font-mono text-xs text-muted-foreground">{value}</p>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1 text-sm font-medium text-destructive hover:underline"
            >
              <X className="size-3.5" aria-hidden="true" />
              Remove image
            </button>
          </div>
        </div>
      ) : null}
      <div>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={ACCEPTED.join(',')}
          disabled={busy}
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="sr-only"
        />
        <label
          htmlFor={id}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-input bg-card px-4 text-sm font-medium transition-colors hover:bg-muted has-[:focus-visible]:ring-2"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ImageUp className="size-4" aria-hidden="true" />
          )}
          {busy ? 'Uploading' : value ? 'Replace image' : 'Upload image'}
        </label>
      </div>
      {hint && !message ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {message ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  )
}
