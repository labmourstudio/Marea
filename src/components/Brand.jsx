import { useSiteSettings } from '../context/SiteSettingsContext'
import { publicStorageUrl } from '../lib/supabase'

export default function Brand({ compact = false }) {
  const settings = useSiteSettings()
  const logo = publicStorageUrl('site-assets', settings.logo_path)
  return (
    <div className={`brand${compact ? ' compact' : ''}`} aria-label="Marea">
      {logo ? <img className="brand-logo" src={logo} alt="" /> : <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>}
      <span>Marea</span>
    </div>
  )
}
