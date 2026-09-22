import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import { AdminOnlyRoute, AdminRoute, OnboardingGuard, ProtectedRoute } from './components/RouteGuards'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SiteSettingsProvider } from './context/SiteSettingsContext'
import { LanguageProvider } from './context/LanguageContext'
import AuthPage from './pages/AuthPage'
import { FeedPage, ForbiddenPage, FriendsPage, LearnPage, ProfilePage, ProjectsPage, SearchPage, WorldsPage } from './pages/MainPages'
import OnboardingPage from './pages/OnboardingPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import { AdminPage, AppearanceAdminPage, StudioPage } from './pages/StudioAdminPages'

function AuthCallback() {
  const { session, profile, loading } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (!loading && session) navigate(profile?.onboarding_completed ? '/feed' : '/onboarding', { replace: true })
  }, [loading, navigate, profile, session])
  return <div className="state-view"><p>Đang hoàn tất xác minh…</p></div>
}

export default function App() {
  return <BrowserRouter basename={import.meta.env.BASE_URL}><LanguageProvider><SiteSettingsProvider><AuthProvider><Routes>
    <Route path="/login" element={<AuthPage />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route element={<OnboardingGuard />}><Route path="/onboarding" element={<OnboardingPage />} /></Route>
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/worlds" element={<WorldsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Route>
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/review" element={<AdminPage section="review" />} />
        <Route element={<AdminOnlyRoute />}>
          <Route path="/admin/users" element={<AdminPage section="users" />} />
          <Route path="/admin/audit" element={<AdminPage section="audit" />} />
          <Route path="/admin/settings/appearance" element={<AppearanceAdminPage />} />
        </Route>
      </Route>
      <Route path="/forbidden" element={<ForbiddenPage />} />
    </Route>
    <Route path="/" element={<Navigate to="/feed" replace />} />
    <Route path="*" element={<Navigate to="/feed" replace />} />
  </Routes></AuthProvider></SiteSettingsProvider></LanguageProvider></BrowserRouter>
}
