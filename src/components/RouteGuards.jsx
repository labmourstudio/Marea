import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingState } from './StateView'

export function ProtectedRoute() {
  const { configured, session, profile, loading } = useAuth()
  const location = useLocation()
  if (!configured) return <Navigate to="/login" replace />
  if (loading) return <LoadingState label="Đang kiểm tra phiên đăng nhập…" />
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  if (['blocked', 'disabled'].includes(profile?.account_status) && location.pathname !== '/forbidden') return <Navigate to="/forbidden" replace />
  if (!profile?.onboarding_completed && location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />
  return <Outlet />
}

export function OnboardingGuard() {
  const { configured, session, profile, loading } = useAuth()
  if (!configured || (!loading && !session)) return <Navigate to="/login" replace />
  if (loading) return <LoadingState />
  if (profile?.onboarding_completed) return <Navigate to="/feed" replace />
  return <Outlet />
}

export function AdminRoute() {
  const { profile, loading } = useAuth()
  if (loading) return <LoadingState />
  if (profile?.account_status !== 'active' || !['owner', 'admin', 'moderator'].includes(profile?.platform_role)) return <Navigate to="/forbidden" replace />
  return <Outlet />
}

export function AdminOnlyRoute() {
  const { profile, loading } = useAuth()
  if (loading) return <LoadingState />
  if (profile?.account_status !== 'active' || !['owner', 'admin'].includes(profile?.platform_role)) return <Navigate to="/forbidden" replace />
  return <Outlet />
}
