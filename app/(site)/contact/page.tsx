import type { Metadata } from 'next'
import { ProsePage } from '@/components/site/prose-page'
import { getSettings } from '@/lib/data/public'
import { buildPageMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return buildPageMetadata({
    title: 'Contact',
    description: `Contact the ${settings.site_name} team with questions, corrections or feedback.`,
    path: '/contact',
    settings,
  })
}

export default async function ContactPage() {
  const settings = await getSettings()
  const hasContact = Boolean(settings.contact_email || settings.contact_details)

  return (
    <ProsePage
      title="Contact"
      description="Questions, corrections and feedback are welcome."
      path="/contact"
    >
      {hasContact ? (
        <>
          {settings.contact_email ? (
            <p>
              Email us at <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>.
            </p>
          ) : null}
          {settings.contact_details ? <p className="whitespace-pre-line">{settings.contact_details}</p> : null}
        </>
      ) : (
        <p>Contact details have not been published yet. Please check back soon.</p>
      )}
    </ProsePage>
  )
}
