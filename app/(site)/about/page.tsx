import type { Metadata } from 'next'
import Link from 'next/link'
import { ProsePage } from '@/components/site/prose-page'
import { getSettings } from '@/lib/data/public'
import { buildPageMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return buildPageMetadata({
    title: 'About',
    description: `${settings.site_name} is a curated library of detailed AI image-generation prompts, written to be copied, adapted and reused.`,
    path: '/about',
    settings,
  })
}

export default async function AboutPage() {
  const settings = await getSettings()
  return (
    <ProsePage
      title={`About ${settings.site_name}`}
      description="A focused library of prompts for people who make images with AI."
      path="/about"
    >
      <p>
        {settings.site_name} collects detailed, readable prompts for AI image generation. Each entry explains the
        subject, lighting, lens, mood and style in plain language, so you can understand why a prompt works and change
        it to suit your own idea.
      </p>
      <h2>How the library is organised</h2>
      <p>
        Prompts are grouped into <Link href="/categories">categories</Link> such as portraits, cinematic photography,
        3D illustrations and product photography, and tagged by subject and style. You can{' '}
        <Link href="/search">search</Link> by keyword, filter by category or tag, and copy any prompt with one click.
      </p>
      <h2>What to expect</h2>
      <ul>
        <li>Prompts are written and reviewed before they are published.</li>
        <li>Results differ between image models and versions, so treat every prompt as a starting point.</li>
        <li>Featured images show an example of the intended direction, not a guaranteed output.</li>
      </ul>
      <h2>Get in touch</h2>
      <p>
        Questions, corrections or suggestions are welcome. Visit the <Link href="/contact">contact page</Link>.
      </p>
    </ProsePage>
  )
}
