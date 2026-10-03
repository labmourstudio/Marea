import { useEffect, useState } from 'react'
import { useBackend } from '../context/BackendContext'
import { supabase } from '../lib/supabase'
import MfaSecurity from './MfaSecurity'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ErrorState, LoadingState } from './StateView'

export function ProtectedRoute() {
  const { configured, session, profile, profileError, loading, refreshProfile } = useAuth()
  const location = useLocation()
  if (!configured) return <Navigate to="/login" replace />
  if (loading) return <LoadingState label="Đang kiểm tra phiên đăng nhập…" />
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  if (profileError) return <ErrorState message={profileError} retry={refreshProfile} />
  if (['blocked', 'disabled'].includes(profile?.account_status) && location.pathname !== '/forbidden') return <Navigate to="/forbidden" replace />
  if (!profile?.onboarding_completed && location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />
  return <Outlet />
}

export function OnboardingGuard() {
  const { configured, session, profile, profileError, loading, refreshProfile } = useAuth()
  if (!configured || (!loading && !session)) return <Navigate to="/login" replace />
  if (loading) return <LoadingState />
  if (profileError) return <ErrorState message={profileError} retry={refreshProfile} />
  if (profile?.onboarding_completed) return <Navigate to="/feed" replace />
  return <Outlet />
}

export function AdminRoute() {
  const { profile, loading, session } = useAuth()
  const { admin_mfa: ready, loading: checking } = useBackend()
  const [verified, setVerified] = useState(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    if (!session) return undefined
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data,error }) => {
      if (active) setVerified({ token:session.access_token, aal2:!error && data?.currentLevel === 'aal2' })
    })
    return () => { active = false }
  }, [session,attempt])
  if (loading || checking) return <LoadingState />
  if (profile?.account_status !== 'active' || !['owner','admin','moderator'].includes(profile?.platform_role)) return <Navigate to="/forbidden" replace />
  if (!ready) return <ErrorState message="Quản trị đang chờ áp dụng migration bảo mật Mora trên Supabase. Xem tài liệu triển khai trong repository." />
  if (verified?.token !== session.access_token) return <LoadingState />
  if (!verified.aal2) return <div className="admin-gate"><MfaSecurity required onVerified={() => setAttempt((value) => value+1)} /></div>
  return <Outlet />
}

export function AdminOnlyRoute() {
  const { profile, loading } = useAuth()
  if (loading) return <LoadingState />
  if (profile?.account_status !== 'active' || !['owner', 'admin'].includes(profile?.platform_role)) return <Navigate to="/forbidden" replace />
  return <Outlet />
}
