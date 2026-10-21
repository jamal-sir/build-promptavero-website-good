import type { Metadata } from 'next'
import { AdminHeader } from '@/components/admin/admin-header'
import { SettingsForm } from '@/components/admin/settings-form'
import { requireAdmin } from '@/lib/admin/auth'
import { DEFAULT_SETTINGS, type SiteSettings } from '@/lib/types'

export const metadata: Metadata = { title: 'Settings' }
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle()
  const settings = (data as SiteSettings | null) ?? DEFAULT_SETTINGS

  return (
    <>
      <AdminHeader title="Settings" description="Brand, SEO, analytics and advertising." />
      <SettingsForm key={settings.updated_at} settings={settings} />
    </>
  )
}
