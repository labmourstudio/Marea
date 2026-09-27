import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, Gamepad2, Globe2 } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { supabase } from '../lib/supabase'
import { pendingInvite, rememberInvite } from '../lib/pendingInvite'

export default function AuthPage() {
  const { configured, session, profile, loading } = useAuth()
  const { language } = useLanguage()
  const vi = language === 'vi'
  const [mode, setMode] = useState('login')
  const [emailMode, setEmailMode] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const fromInvite = location.state?.from?.pathname
  useEffect(() => { if (fromInvite) rememberInvite(fromInvite) }, [fromInvite])
  const afterLogin = (fromInvite?.startsWith('/invite/') ? fromInvite : pendingInvite()) || '/feed'

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

  return <div className="auth-shell">
    <span className="aurora auth-a" /><span className="aurora auth-b" /><span className="aurora auth-c" />
    <header className="auth-header"><Brand /></header>
    <section className="auth-visual">
      <div className="orbit orbit-one" /><div className="orbit orbit-two" />
      <div className="world-sphere"><div className="sphere-core"><Globe2 size={38} /><span>MORA</span><div className="float-chip chip-a"><BookOpen /> {vi ? 'Truyện' : 'Stories'}</div><div className="float-chip chip-b"><Gamepad2 /> Games</div></div></div>
      <div className="auth-story"><div className="eyebrow"><span /> MORA · MOUR STUDIO</div><h1>Create<br />& Connect.</h1><p>{vi ? 'Nơi ý tưởng tìm thấy nhau.' : 'Where ideas find each other.'}</p></div>
    </section>
    <section className="auth-panel-wrap"><div className="auth-panel glass-card">
      <div className="auth-title"><Brand /><h2>{mode === 'login' ? vi ? 'Chào mừng trở lại' : 'Welcome back' : vi ? 'Tạo tài khoản Mora' : 'Create your Mora account'}</h2><p>{mode === 'login' ? vi ? 'Khám phá, chia sẻ và kết nối sáng tạo.' : 'Explore, share and connect your creative work.' : vi ? 'Tham gia cộng đồng sáng tạo của Mour Studio.' : 'Join Mour Studio’s creative community.'}</p></div>
      {!configured ? <div className="config-notice"><strong>{vi ? 'Chưa kết nối Supabase' : 'Supabase is not configured'}</strong><p>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to GitHub Actions secrets.</p></div> : !emailMode ? <>
        {import.meta.env.VITE_ENABLE_GOOGLE_OAUTH === 'true' && <button className="social-button" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}><span className="google-g">G</span>{vi ? 'Tiếp tục với Google' : 'Continue with Google'}</button>}
        {import.meta.env.VITE_ENABLE_APPLE_OAUTH === 'true' && <button className="social-button" onClick={() => supabase.auth.signInWithOAuth({ provider: 'apple' })}><span className="apple-logo">●</span>{vi ? 'Tiếp tục với Apple' : 'Continue with Apple'}</button>}
        <button className="primary-button full" onClick={() => setEmailMode(true)}>{vi ? 'Tiếp tục bằng email' : 'Continue with email'}</button>
      </> : <form className="email-form" onSubmit={submit}>
        <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>{vi ? 'Mật khẩu' : 'Password'}<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {mode === 'login' && <div className="form-row"><span /><button type="button" className="text-button" onClick={forgotPassword}>{vi ? 'Quên mật khẩu?' : 'Forgot password?'}</button></div>}
        <button className="primary-button full" disabled={busy}>{busy ? vi ? 'Đang xử lý…' : 'Working…' : mode === 'login' ? vi ? 'Đăng nhập' : 'Sign in' : vi ? 'Đăng ký' : 'Sign up'}</button>
        <button type="button" className="back-email" onClick={() => setEmailMode(false)}><ArrowLeft size={14} /> {vi ? 'Quay lại' : 'Back'}</button>
      </form>}
      {error && <p className="form-message error">{error}</p>}{message && <p className="form-message success">{message}</p>}
      <p className="auth-switch">{mode === 'login' ? vi ? 'Chưa có tài khoản?' : 'New here?' : vi ? 'Đã có tài khoản?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setMessage('') }}>{mode === 'login' ? vi ? 'Đăng ký' : 'Sign up' : vi ? 'Đăng nhập' : 'Sign in'}</button></p>
      <p className="terms">{vi ? 'Khi tiếp tục, bạn đồng ý với Điều khoản và Chính sách quyền riêng tư của Mora.' : 'By continuing, you agree to Mora’s Terms and Privacy Policy.'}</p>
    </div></section>
  </div>
}
