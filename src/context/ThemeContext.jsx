import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)
export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('mora-theme') || 'system')
  const [deviceDark, setDeviceDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches || false)
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setDeviceDark(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    const active = mode === 'system' ? (deviceDark ? 'dark' : 'light') : mode
    document.documentElement.dataset.theme = active
    document.documentElement.style.colorScheme = mode === 'system' ? 'light dark' : mode
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', active === 'dark' ? '#090f27' : '#eff4ff')
  }, [mode, deviceDark])
  const value = useMemo(() => ({ mode, setMode: (next) => { if (['system','light','dark'].includes(next)) { setMode(next); localStorage.setItem('mora-theme', next) } } }), [mode])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
export function useTheme() { return useContext(ThemeContext) }
