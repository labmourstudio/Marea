import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { pendingInvite } from '../lib/pendingInvite'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const { configured, session, profile, loading } = useAuth()
  const { language } = useLanguage()
  const vi = language === 'vi'
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const source = location.state?.from
  const returnTo = source?.pathname ? `${source.pathname}${source.search || ''}` : null
  const afterLogin = pendingInvite() || (returnTo?.startsWith('/') && !returnTo.startsWith('//') && !['/login','/auth/callback'].includes(source?.pathname) ? returnTo : '/feed')

  if (!loading && session) return <Navigate to={profile?.onboarding_completed ? afterLogin : '/onboarding'} replace />

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      if (mode === 'register') {
        const { error: authError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth/callback` } })
        if (authError) throw authError
        setMessage(vi ? 'Đã tạo tài khoản. Hãy kiểm tra email để xác minh trước khi đăng nhập.' : 'Account created. Check your email to verify it before signing in.')
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) throw authError
        navigate(afterLogin)
      }
    } catch (authError) { setError(authError.message) } finally { setBusy(false) }
  }

  async function forgotPassword() {
    if (!email) { setError(vi ? 'Nhập email trước khi yêu cầu đặt lại mật khẩu.' : 'Enter your email before requesting a password reset.'); return }
    setBusy(true); setError('')
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}reset-password` })
    setBusy(false)
    if (authError) setError(authError.message); else setMessage(vi ? 'Liên kết đặt lại mật khẩu đã được gửi.' : 'Password reset link sent.')
  }

  return <main className="auth-shell auth-shell-simple">
    <span className="aurora auth-a" /><span className="aurora auth-b" />
    <section className="auth-panel-wrap"><div className="auth-panel glass-card">
      <div className="auth-title"><Brand /><span className="auth-tagline">Create &amp; Connect</span><h1>{mode === 'login' ? vi ? 'Đăng nhập' : 'Sign in' : vi ? 'Đăng ký' : 'Sign up'}</h1><p>{vi ? 'Nơi ý tưởng tìm thấy nhau.' : 'Where ideas find each other.'}</p></div>
      {!configured ? <div className="config-notice"><strong>{vi ? 'Chưa kết nối Supabase' : 'Supabase is not configured'}</strong><p>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to GitHub Actions secrets.</p></div> : <form className="email-form" onSubmit={submit}>
        <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>{vi ? 'Mật khẩu' : 'Password'}<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {mode === 'login' && <div className="form-row"><span /><button type="button" className="text-button" onClick={forgotPassword}>{vi ? 'Quên mật khẩu?' : 'Forgot password?'}</button></div>}
        <button className="primary-button full" disabled={busy}>{busy ? vi ? 'Đang xử lý…' : 'Working…' : mode === 'login' ? vi ? 'Đăng nhập' : 'Sign in' : vi ? 'Đăng ký' : 'Sign up'}</button>
      </form>}
      {configured && import.meta.env.VITE_ENABLE_GOOGLE_OAUTH === 'true' && <button className="social-button" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth/callback` } })}><span className="google-g">G</span>{vi ? 'Tiếp tục với Google' : 'Continue with Google'}</button>}
      {configured && import.meta.env.VITE_ENABLE_APPLE_OAUTH === 'true' && <button className="social-button" onClick={() => supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth/callback` } })}><span className="apple-logo">●</span>{vi ? 'Tiếp tục với Apple' : 'Continue with Apple'}</button>}
      {error && <p className="form-message error">{error}</p>}{message && <p className="form-message success">{message}</p>}
      <p className="auth-switch">{mode === 'login' ? vi ? 'Chưa có tài khoản?' : 'New here?' : vi ? 'Đã có tài khoản?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setMessage('') }}>{mode === 'login' ? vi ? 'Đăng ký' : 'Sign up' : vi ? 'Đăng nhập' : 'Sign in'}</button></p>
      <p className="auth-credit">Mora · Mour Studio</p>
    </div></section>
  </main>
}
