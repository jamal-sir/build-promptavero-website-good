import type { Metadata } from 'next'
import Link from 'next/link'
import { ProsePage } from '@/components/site/prose-page'
import { getSettings } from '@/lib/data/public'
import { buildPageMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return buildPageMetadata({
    title: 'Terms of Service',
    description: `The terms that apply when you use ${settings.site_name}.`,
    path: '/terms',
    settings,
  })
}

export default async function TermsPage() {
  const settings = await getSettings()
  const name = settings.site_name

  return (
    <ProsePage
      title="Terms of Service"
      description={`The terms that apply when you use ${name}.`}
      path="/terms"
      updated="October 21, 2026"
    >
      <p>By using {name}, you agree to these terms. If you do not agree, please do not use the site.</p>

      <h2>Using the prompts</h2>
      <p>
        Prompts are provided for personal and commercial creative use. You may copy and adapt them to generate images
        with the AI tools you choose. You are responsible for following the terms of those tools and for how you use
        what they produce.
      </p>

      <h2>Our content</h2>
      <p>
        The site design, written descriptions, featured images and compiled library belong to {name} or its licensors.
        You may not republish the library in bulk, scrape it to build a competing service, or present our content as
        your own.
      </p>

      <h2>No guarantees</h2>
      <p>
        AI models change often and produce different results each time. Prompts and featured images are examples, not
        promises of a particular output. The site is provided &ldquo;as is&rdquo; without warranties of any kind.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not attempt to disrupt, overload or gain unauthorised access to the site.</li>
        <li>Do not use the site or its prompts to create unlawful, hateful or deceptive content.</li>
      </ul>

      <h2>Limitation of liability</h2>
      <p>
        To the extent permitted by law, {name} is not liable for indirect or consequential losses arising from your
        use of the site or from content generated using its prompts.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We may update these terms from time to time. Continued use of the site means you accept the updated terms.
        Questions can be sent through the <Link href="/contact">contact page</Link>. See also our{' '}
        <Link href="/privacy-policy">Privacy Policy</Link>.
      </p>
    </ProsePage>
  )
}
