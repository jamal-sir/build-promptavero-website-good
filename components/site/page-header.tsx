import { Breadcrumbs, type Crumb } from './breadcrumbs'

type Props = {
  title: string
  description?: string
  eyebrow?: string
  crumbs?: Crumb[]
  children?: React.ReactNode
}

export function PageHeader({ title, description, eyebrow, crumbs, children }: Props) {
  return (
    <div className="border-b border-border/70">
      <div className="container-page py-10 sm:py-14">
        {crumbs ? <Breadcrumbs items={crumbs} /> : null}
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">{title}</h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>
        ) : null}
        {children}
      </div>
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children ? <div className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{children}</div> : null}
    </div>
  )
}
