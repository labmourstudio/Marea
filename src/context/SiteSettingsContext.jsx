import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, publicStorageUrl, supabase } from '../lib/supabase'

const defaults = { accent_color: '#7668ed', logo_path: '', favicon_path: '', font_family: 'Manrope', glass_opacity: 0.68 }
const SiteSettingsContext = createContext(defaults)

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaults)
  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.from('site_settings').select('key,value').then(({ data }) => {
      if (!data) return
      const next = { ...defaults }
      data.forEach((item) => { if (item.key in next) next[item.key] = item.value })
      setSettings(next)
      document.documentElement.style.setProperty('--purple', next.accent_color)
      document.documentElement.style.setProperty('--surface-alpha', next.glass_opacity)
      document.documentElement.style.setProperty('--brand-font', `'${next.font_family}', 'Segoe UI', sans-serif`)
      if (next.favicon_path) {
        let link = document.querySelector("link[rel='icon']")
        if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link) }
        link.href = publicStorageUrl('site-assets', next.favicon_path)
      }
    })
  }, [])
  const value = useMemo(() => settings, [settings])
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
}

export function useSiteSettings() { return useContext(SiteSettingsContext) }

