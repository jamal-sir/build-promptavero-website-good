import { getSettings } from '@/lib/data/public'
import { AdUnit } from './ad-unit'

/** Renders nothing until ads are enabled and fully configured in Admin > Settings. */
export async function AdSlot({ placement }: { placement: 'listing' | 'prompt' }) {
  const s = await getSettings()
  const slot = placement === 'listing' ? s.ad_slot_listing : s.ad_slot_prompt
  if (!s.ads_enabled || !s.adsense_client_id || !slot) return null
  return <AdUnit clientId={s.adsense_client_id} slot={slot} />
}
