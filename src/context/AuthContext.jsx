import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(isSupabaseConfigured)
  const [profileState, setProfileState] = useState({ userId: null, data: null, error: '', loading: false })
  const identity = useRef(null)
  const requestId = useRef(0)
  const mounted = useRef(true)

  const loadProfile = useCallback(async (userId) => {
    if (!supabase || !userId) return null
    const request = ++requestId.current
    setProfileState((current) => ({ ...current, userId, loading: true, error: '' }))
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      if (error) throw error
      if (!data) throw new Error('Không tìm thấy hồ sơ. Hãy tải lại hoặc đăng nhập lại.')
      if (mounted.current && identity.current === userId && request === requestId.current) setProfileState({ userId, data, error: '', loading: false })
      return data
    } catch (error) {
      if (mounted.current && identity.current === userId && request === requestId.current) setProfileState({ userId, data: null, error: error.message, loading: false })
      return null
    }
  }, [])

  useEffect(() => {
    if (!supabase) return undefined
    mounted.current = true
    let receivedAuthEvent = false
    const applySession = (nextSession) => {
      const nextId = nextSession?.user?.id || null
      const changed = identity.current !== nextId
      identity.current = nextId
      setSession(nextSession)
      setSessionLoading(false)
      if (!nextId) {
        requestId.current += 1
        setProfileState({ userId: null, data: null, error: '', loading: false })
      } else if (changed) {
        setProfileState({ userId: nextId, data: null, error: '', loading: true })
        setTimeout(() => { if (mounted.current && identity.current === nextId) loadProfile(nextId) }, 0)
      }
    }
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      receivedAuthEvent = true
      applySession(nextSession)
    })
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted.current || receivedAuthEvent) return
      if (error) setSessionLoading(false)
      else applySession(data.session)
    }).catch(() => { if (mounted.current) setSessionLoading(false) })
    return () => { mounted.current = false; requestId.current += 1; listener.subscription.unsubscribe() }
  }, [loadProfile])

  const userId = session?.user?.id
  const profile = profileState.userId === userId ? profileState.data : null
  const profileError = profileState.userId === userId ? profileState.error : ''
  const loading = sessionLoading || !!(userId && (profileState.userId !== userId || profileState.loading))
  const refreshProfile = useCallback(() => loadProfile(identity.current), [loadProfile])
  const value = useMemo(() => ({ configured: isSupabaseConfigured, session, user: session?.user ?? null, profile, profileError, loading, refreshProfile, signOut: () => supabase?.auth.signOut() }), [session, profile, profileError, loading, refreshProfile])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
