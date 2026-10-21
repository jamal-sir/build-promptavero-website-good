'use client'

import { useActionState, useState } from 'react'
import { FormMessage, Section, SubmitButton } from '@/components/admin/field'
import { ImageUploader } from '@/components/admin/image-uploader'
import { CheckboxField, TextAreaField, TextField } from '@/components/admin/inputs'
import { saveSettingsAction } from '@/lib/admin/actions'
import type { SiteSettings } from '@/lib/types'

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action] = useActionState(saveSettingsAction, {})
  const fe = state.fieldErrors ?? {}
  const v = state.values ?? {}
  const pick = (key: keyof SiteSettings) => v[key] ?? (settings[key] as string | null) ?? ''
  const flag = (key: keyof SiteSettings) =>
    Object.keys(v).length ? v[key] === 'on' : Boolean(settings[key])

  const [logo, setLogo] = useState(settings.logo_url ?? '')
  const [favicon, setFavicon] = useState(settings.favicon_url ?? '')
  const [ogImage, setOgImage] = useState(settings.default_og_image_url ?? '')

  return (
    <form action={action} className="max-w-3xl space-y-6">
      <input type="hidden" name="logo_url" value={logo} />
      <input type="hidden" name="favicon_url" value={favicon} />
      <input type="hidden" name="default_og_image_url" value={ogImage} />
      <FormMessage state={state} />

      <Section title="Brand">
        <TextField name="site_name" label="Site name" required maxLength={60} defaultValue={pick('site_name')} error={fe.site_name} />
        <TextField name="tagline" label="Tagline" maxLength={160} defaultValue={pick('tagline')} error={fe.tagline} />
        <ImageUploader
          label="Logo"
          folder="brand"
          value={logo || null}
          onChange={(img) => setLogo(img?.url ?? '')}
          error={fe.logo_url}
          hint="Used in structured data. The header wordmark is unchanged."
        />
        <ImageUploader
          label="Favicon"
          folder="brand"
          value={favicon || null}
          onChange={(img) => setFavicon(img?.url ?? '')}
          error={fe.favicon_url}
          hint="A square PNG works best."
        />
      </Section>

      <Section title="Search and sharing" description="Defaults used when a page has no title or description of its own.">
        <TextField
          name="default_seo_title"
          label="Default SEO title"
          required
          maxLength={120}
          defaultValue={pick('default_seo_title')}
          error={fe.default_seo_title}
        />
        <TextAreaField
          name="default_seo_description"
          label="Default meta description"
          required
          rows={3}
          maxLength={320}
          defaultValue={pick('default_seo_description')}
          error={fe.default_seo_description}
        />
        <ImageUploader
          label="Default social image"
          folder="brand"
          value={ogImage || null}
          onChange={(img) => setOgImage(img?.url ?? '')}
          error={fe.default_og_image_url}
          hint="1200 by 630 pixels works best for link previews."
        />
        <CheckboxField
          name="allow_indexing"
          label="Allow search engines to index the site"
          hint="Turn off to send a noindex signal on every page."
          defaultChecked={flag('allow_indexing')}
        />
        <CheckboxField
          name="sitemap_enabled"
          label="Publish sitemap.xml"
          defaultChecked={flag('sitemap_enabled')}
        />
      </Section>

      <Section title="Domain">
        <TextField
          name="site_url"
          label="Canonical site URL"
          type="url"
          inputMode="url"
          placeholder="https://promptavero.com"
          defaultValue={pick('site_url')}
          error={fe.site_url}
          hint="Used for canonical links, the sitemap and structured data. Leave blank to detect automatically."
        />
        <TextField
          name="custom_domain"
          label="Custom domain"
          placeholder="promptavero.com"
          defaultValue={pick('custom_domain')}
          error={fe.custom_domain}
          hint="Used when no canonical site URL is set. Connect the domain itself in your Vercel project settings."
        />
      </Section>

      <Section title="Contact and social">
        <TextField
          name="contact_email"
          label="Contact email"
          type="email"
          inputMode="email"
          defaultValue={pick('contact_email')}
          error={fe.contact_email}
        />
        <TextAreaField
          name="contact_details"
          label="Contact details"
          rows={3}
          maxLength={1000}
          defaultValue={pick('contact_details')}
          error={fe.contact_details}
          hint="Shown on the contact page."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="x_url" label="X profile" type="url" inputMode="url" placeholder="https://x.com/..." defaultValue={pick('x_url')} error={fe.x_url} />
          <TextField name="instagram_url" label="Instagram profile" type="url" inputMode="url" placeholder="https://instagram.com/..." defaultValue={pick('instagram_url')} error={fe.instagram_url} />
          <TextField name="youtube_url" label="YouTube channel" type="url" inputMode="url" placeholder="https://youtube.com/..." defaultValue={pick('youtube_url')} error={fe.youtube_url} />
          <TextField name="pinterest_url" label="Pinterest profile" type="url" inputMode="url" placeholder="https://pinterest.com/..." defaultValue={pick('pinterest_url')} error={fe.pinterest_url} />
        </div>
      </Section>

      <Section title="Analytics and verification" description="Analytics only loads after a visitor accepts cookies.">
        <TextField
          name="google_analytics_id"
          label="Google Analytics measurement ID"
          placeholder="G-XXXXXXXXXX"
          defaultValue={pick('google_analytics_id')}
          error={fe.google_analytics_id}
        />
        <TextField
          name="google_site_verification"
          label="Google Search Console verification code"
          defaultValue={pick('google_site_verification')}
          error={fe.google_site_verification}
          hint="The content value of the google-site-verification meta tag."
        />
        <TextField
          name="bing_site_verification"
          label="Bing Webmaster verification code"
          defaultValue={pick('bing_site_verification')}
          error={fe.bing_site_verification}
        />
      </Section>

      <Section title="Advertising" description="Ads load only after a visitor accepts cookies, and never in the admin.">
        <CheckboxField name="ads_enabled" label="Show Google AdSense ads" defaultChecked={flag('ads_enabled')} />
        <TextField
          name="adsense_client_id"
          label="AdSense publisher ID"
          placeholder="ca-pub-1234567890123456"
          defaultValue={pick('adsense_client_id')}
          error={fe.adsense_client_id}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="ad_slot_listing"
            label="Listing page ad slot ID"
            inputMode="numeric"
            defaultValue={pick('ad_slot_listing')}
            error={fe.ad_slot_listing}
          />
          <TextField
            name="ad_slot_prompt"
            label="Prompt page ad slot ID"
            inputMode="numeric"
            defaultValue={pick('ad_slot_prompt')}
            error={fe.ad_slot_prompt}
          />
        </div>
      </Section>

      <SubmitButton>Save settings</SubmitButton>
    </form>
  )
}
