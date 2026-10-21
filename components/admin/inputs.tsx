import { Field, describedBy, inputClass } from '@/components/admin/field'

type BaseProps = {
  name: string
  label: string
  hint?: string
  error?: string
  className?: string
}

type TextFieldProps = BaseProps & {
  defaultValue?: string | number | null
  type?: 'text' | 'email' | 'url' | 'number'
  maxLength?: number
  placeholder?: string
  required?: boolean
  inputMode?: 'text' | 'numeric' | 'url' | 'email'
}

export function TextField({
  name,
  label,
  hint,
  error,
  className,
  defaultValue,
  type = 'text',
  maxLength,
  placeholder,
  required,
  inputMode,
}: TextFieldProps) {
  return (
    <Field label={label} htmlFor={name} hint={hint} error={error} className={className}>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ''}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        autoComplete="off"
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(name, hint, error)}
        className={inputClass}
      />
    </Field>
  )
}

type TextAreaFieldProps = BaseProps & {
  defaultValue?: string | null
  rows?: number
  maxLength?: number
  required?: boolean
  mono?: boolean
}

export function TextAreaField({
  name,
  label,
  hint,
  error,
  className,
  defaultValue,
  rows = 4,
  maxLength,
  required,
  mono,
}: TextAreaFieldProps) {
  return (
    <Field label={label} htmlFor={name} hint={hint} error={error} className={className}>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ''}
        maxLength={maxLength}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(name, hint, error)}
        className={`${inputClass} resize-y leading-relaxed ${mono ? 'font-mono text-[13px]' : ''}`}
      />
    </Field>
  )
}

export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string
  label: string
  hint?: string
  defaultChecked?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={name}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        aria-describedby={hint ? `${name}-hint` : undefined}
        className="mt-0.5 size-4 shrink-0 rounded border-input accent-[var(--brand)]"
      />
      <div>
        <label htmlFor={name} className="text-sm font-medium">
          {label}
        </label>
        {hint ? (
          <p id={`${name}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  )
}
