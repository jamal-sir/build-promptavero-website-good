import type { Metadata } from 'next'
import Link from 'next/link'
import { ProsePage } from '@/components/site/prose-page'
import { getSettings } from '@/lib/data/public'
import { buildPageMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return buildPageMetadata({
    title: 'Privacy Policy',
    description: `How ${settings.site_name} handles visitor data, cookies, analytics and advertising.`,
    path: '/privacy-policy',
    settings,
  })
}

export default async function PrivacyPage() {
  const settings = await getSettings()
  const name = settings.site_name

  return (
    <ProsePage
      title="Privacy Policy"
      description={`How ${name} handles information when you visit the site.`}
      path="/privacy-policy"
      updated="October 21, 2026"
    >
      <p>
        This policy explains what information {name} collects, why, and the choices you have. Visitors do not need an
        account to browse or copy prompts.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Search queries.</strong> Text you type into the search box is sent to our servers so we can return
          results. We do not link searches to an identity.
        </li>
        <li>
          <strong>Technical data.</strong> Our hosting provider processes standard request data such as IP address,
          browser type and pages requested in order to deliver the site and keep it secure.
        </li>
        <li>
          <strong>Messages.</strong> If you email us, we keep the message and your address to reply.
        </li>
      </ul>

      <h2>Cookies and local storage</h2>
      <p>
        We store your light or dark theme preference and your cookie choice in your browser&apos;s local storage.
        Site administrators receive a sign-in session cookie; visitors do not.
      </p>

      <h2>Analytics and advertising</h2>
      <p>
        {settings.google_analytics_id
          ? 'We use Google Analytics to understand how the site is used. It loads only after you accept optional cookies.'
          : 'We do not currently load third-party analytics.'}{' '}
        {settings.ads_enabled
          ? 'We may show advertising served by Google AdSense, which can use cookies to personalise ads. Ads load only after you accept optional cookies, and you can learn more about how Google uses data at policies.google.com/technologies/partner-sites.'
          : 'We do not currently show advertising.'}
      </p>
      <p>
        If you decline optional cookies, no analytics or advertising scripts are loaded. You can change your choice at
        any time by clearing this site&apos;s data in your browser.
      </p>

      <h2>How we use information</h2>
      <p>
        We use information to operate and secure the site, improve the prompt library, respond to messages and meet
        legal obligations. We do not sell personal information.
      </p>

      <h2>Retention and your rights</h2>
      <p>
        Depending on where you live, you may have the right to access, correct or delete personal information we hold
        about you, or to object to certain processing. To make a request, use the{' '}
        <Link href="/contact">contact page</Link>.
      </p>

      <h2>Children</h2>
      <p>The site is not directed at children under 13, and we do not knowingly collect their information.</p>

      <h2>Changes</h2>
      <p>We may update this policy and will change the date above when we do.</p>
    </ProsePage>
  )
}
