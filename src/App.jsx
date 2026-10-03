import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { LoadingState } from './components/StateView'
import AppLayout from './components/AppLayout'
import { AdminOnlyRoute, AdminRoute, OnboardingGuard, ProtectedRoute } from './components/RouteGuards'
import { AuthProvider, useAuth } from './context/AuthContext'
import { BackendProvider } from './context/BackendContext'
import { pendingInvite } from './lib/pendingInvite'
import ProfilePage, { ProfileEditorPage } from './pages/ProfilePage'
import { CoursePage, CourseEditorPage } from './pages/CoursePages'
import NotificationsPage from './pages/NotificationsPage'
import { SiteSettingsProvider } from './context/SiteSettingsContext'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import LanguageWelcome from './components/LanguageWelcome'
import SettingsPage from './pages/SettingsPage'
const DemoPage = lazy(() => import('./pages/DemoPage'))
import AuthPage from './pages/AuthPage'
import { ForbiddenPage, LearnPage, SearchPage, WorldsPage } from './pages/MainPages'
import FriendsPage from './pages/FriendsPage'
import ProjectDiscoveryPage from './pages/ProjectDiscoveryPage'
import PublicProjectPage from './pages/PublicProjectPage'
import FeedPage, { ProjectActivityPage } from './pages/FeedPage'
import OnboardingPage from './pages/OnboardingPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import { AdminPage, AppearanceAdminPage, StudioPage } from './pages/StudioAdminPages'
import LocalProjectsPage from './pages/LocalProjectsPage'
const ProjectStudioPage = lazy(() => import('./pages/ProjectPages').then((module) => ({ default:module.ProjectStudioPage })))
const ProjectInvitePage = lazy(() => import('./pages/ProjectPages').then((module) => ({ default:module.ProjectInvitePage })))

function PublicProfileRoute() { const { username } = useParams(); return <ProfilePage key={username} /> }
function PublicProjectRoute() { const { projectId } = useParams(); return <PublicProjectPage key={projectId} /> }
function ProjectEditorRoute() { const { projectId } = useParams(); return <ProjectStudioPage key={projectId} /> }

function AuthCallback() {
  const { session, profile, loading } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (!loading && session) navigate(profile?.onboarding_completed ? pendingInvite() || '/feed' : '/onboarding', { replace: true })
  }, [loading, navigate, profile, session])
  return <div className="state-view"><p>Đang hoàn tất xác minh…</p></div>
}

export default function App() {
  return <BrowserRouter basename={import.meta.env.BASE_URL}><LanguageProvider><ThemeProvider><LanguageWelcome /><SiteSettingsProvider><AuthProvider><BackendProvider><Suspense fallback={<LoadingState />}><Routes>
    <Route path="/login" element={<AuthPage />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route element={<OnboardingGuard />}><Route path="/onboarding" element={<OnboardingPage />} /></Route>
    <Route path="/invite/:token" element={<ProjectInvitePage />} />
    <Route element={<AppLayout />}>
      <Route path="/projects" element={<ProjectDiscoveryPage />} />
      <Route path="/projects/:projectId/activity" element={<ProjectActivityPage />} />
      <Route path="/projects/:projectId" element={<PublicProjectRoute />} />
      <Route path="/learn" element={<LearnPage />} />
      <Route path="/learn/:courseId" element={<CoursePage />} />
      <Route path="/u/:username" element={<PublicProfileRoute />} />
    </Route>
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/worlds" element={<Navigate to="/studio/projects" replace />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings/profile" element={<ProfileEditorPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/studio/courses/new" element={<CourseEditorPage key="new" />} />
        <Route path="/studio/courses/:courseId" element={<CourseEditorPage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/studio/projects" element={<LocalProjectsPage />} />
        <Route path="/studio/legacy-worlds" element={<WorldsPage archiveOnly />} />
        <Route path="/studio/projects/:projectId" element={<ProjectEditorRoute />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/community" element={<DemoPage />} />
        <Route path="/demo" element={<Navigate to="/community" replace />} />
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
  </Routes></Suspense></BackendProvider></AuthProvider></SiteSettingsProvider></ThemeProvider></LanguageProvider></BrowserRouter>
}
