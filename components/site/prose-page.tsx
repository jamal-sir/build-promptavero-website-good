import { PageHeader } from './page-header'

type Props = {
  title: string
  description?: string
  path: string
  updated?: string
  children: React.ReactNode
}

export function ProsePage({ title, description, path, updated, children }: Props) {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        crumbs={[
          { name: 'Home', path: '/' },
          { name: title, path },
        ]}
      />
      <div className="container-narrow py-12">
        {updated ? <p className="mb-8 text-sm text-muted-foreground">Last updated {updated}</p> : null}
        <div className="space-y-5 text-base leading-relaxed text-foreground/90 [&_a]:text-brand [&_a]:underline [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-2">
          {children}
        </div>
      </div>
    </>
  )
}
