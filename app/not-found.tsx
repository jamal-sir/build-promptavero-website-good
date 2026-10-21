import Link from 'next/link'
import { Footer } from '@/components/site/footer'
import { Header } from '@/components/site/header'
import { SearchBox } from '@/components/site/search-box'

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="container-narrow py-24 text-center outline-none">
        <p className="eyebrow mb-4">Error 404</p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">We couldn&apos;t find that page</h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          It may have moved or been unpublished. Try a search, or head back to the library.
        </p>
        <SearchBox variant="hero" className="mx-auto mt-8 max-w-lg text-left" />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Back to home
          </Link>
          <Link
            href="/prompts"
            className="inline-flex h-11 items-center rounded-lg border border-border bg-card px-5 text-sm font-medium hover:bg-muted"
          >
            Explore prompts
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
