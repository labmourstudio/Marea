import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const loadProfile = useCallback(async (userId) => {
    if (!supabase || !userId) {
      setProfile(null)
      return null
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) throw error
    setProfile(data)
    return data
  }, [])

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session?.user) {
        try { await loadProfile(data.session.user.id) } catch { setProfile(null) }
      }
      if (active) setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user) {
        setTimeout(() => loadProfile(nextSession.user.id).catch(() => setProfile(null)), 0)
      } else {
        setProfile(null)
      }
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  const refreshProfile = useCallback(() => loadProfile(session?.user?.id), [loadProfile, session])
  const value = useMemo(() => ({
    configured: isSupabaseConfigured,
    session,
    user: session?.user ?? null,
    profile,
    loading,
    refreshProfile,
    signOut: () => supabase?.auth.signOut(),
  }), [session, profile, loading, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}

