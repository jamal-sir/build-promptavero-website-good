'use client'

import { Trash2 } from 'lucide-react'
import { useActionState, useState } from 'react'
import { SubmitButton } from '@/components/admin/field'
import type { ActionState } from '@/lib/admin/validate'

type Props = {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>
  id: string
  label: string
  warning: string
}

export function DeleteButton({ action, id, label, warning }: Props) {
  const [armed, setArmed] = useState(false)
  const [state, formAction] = useActionState(action, {})

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-destructive/40 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        {label}
      </button>
    )
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
      <input type="hidden" name="id" value={id} />
      <p className="text-sm">{warning}</p>
      {state.error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <SubmitButton className="bg-destructive text-white">Confirm delete</SubmitButton>
        <button
          type="button"
          onClick={() => setArmed(false)}
          className="h-10 rounded-lg border border-input px-4 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
