'use client'

import { useActionState } from 'react'
import { Field, FormMessage, SubmitButton, describedBy, inputClass } from '@/components/admin/field'
import { setupAdminAction, signInAction } from '@/lib/admin/actions'

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signInAction, {})
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ''} />
      <FormMessage state={state} />
      <Field label="Email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.values?.email ?? ''}
          className={inputClass}
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </Field>
      <SubmitButton className="w-full">Sign in</SubmitButton>
    </form>
  )
}

export function SetupForm({ requiresCode }: { requiresCode: boolean }) {
  const [state, action] = useActionState(setupAdminAction, {})
  const fe = state.fieldErrors ?? {}
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <Field label="Email" htmlFor="email" error={fe.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.values?.email ?? ''}
          aria-invalid={Boolean(fe.email)}
          aria-describedby={describedBy('email', undefined, fe.email)}
          className={inputClass}
        />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 10 characters." error={fe.password}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={128}
          required
          aria-invalid={Boolean(fe.password)}
          aria-describedby={describedBy('password', 'hint', fe.password)}
          className={inputClass}
        />
      </Field>
      {requiresCode ? (
        <Field label="Setup code" htmlFor="setup_code" error={fe.setup_code}>
          <input
            id="setup_code"
            name="setup_code"
            type="password"
            autoComplete="off"
            required
            aria-invalid={Boolean(fe.setup_code)}
            className={inputClass}
          />
        </Field>
      ) : null}
      <SubmitButton className="w-full">Create administrator</SubmitButton>
    </form>
  )
}
