import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, Gamepad2, Globe2 } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand'
import LanguageToggle from '../components/LanguageToggle'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { pendingInvite, rememberInvite } from '../lib/pendingInvite'

export default function AuthPage() {
  const { configured, session, profile, loading } = useAuth()
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
        setMessage('Đã tạo tài khoản. Hãy kiểm tra email để xác minh trước khi đăng nhập.')
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) throw authError
        navigate(afterLogin)
      }
    } catch (authError) { setError(authError.message) } finally { setBusy(false) }
  }

  async function forgotPassword() {
    if (!email) { setError('Nhập email trước khi yêu cầu đặt lại mật khẩu.'); return }
    setBusy(true); setError('')
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}reset-password` })
    setBusy(false)
    if (authError) setError(authError.message); else setMessage('Liên kết đặt lại mật khẩu đã được gửi.')
  }

  return <div className="auth-shell">
    <span className="aurora auth-a" /><span className="aurora auth-b" /><span className="aurora auth-c" />
    <header className="auth-header"><Brand /><LanguageToggle glass /></header>
    <section className="auth-visual">
      <div className="orbit orbit-one" /><div className="orbit orbit-two" />
      <div className="world-sphere"><div className="sphere-core"><Globe2 size={38} /><span>MORA</span><div className="float-chip chip-a"><BookOpen /> Truyện</div><div className="float-chip chip-b"><Gamepad2 /> Game</div></div></div>
      <div className="auth-story"><div className="eyebrow"><span /> MORA · MOUR STUDIO</div><h1>Create<br />& Connect.</h1><p>Nơi ý tưởng tìm thấy nhau.</p></div>
    </section>
    <section className="auth-panel-wrap"><div className="auth-panel glass-card">
      <div className="auth-title"><Brand /><h2>{mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản Mora'}</h2><p>{mode === 'login' ? 'Khám phá, chia sẻ và kết nối sáng tạo.' : 'Tham gia cộng đồng sáng tạo của Mour Studio.'}</p></div>
      {!configured ? <div className="config-notice"><strong>Chưa kết nối Supabase</strong><p>Thêm `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` vào GitHub Actions secrets để bật đăng nhập.</p></div> : !emailMode ? <>
        {import.meta.env.VITE_ENABLE_GOOGLE_OAUTH === 'true' && <button className="social-button" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}><span className="google-g">G</span>Tiếp tục với Google</button>}
        {import.meta.env.VITE_ENABLE_APPLE_OAUTH === 'true' && <button className="social-button" onClick={() => supabase.auth.signInWithOAuth({ provider: 'apple' })}><span className="apple-logo">●</span>Tiếp tục với Apple</button>}
        <button className="primary-button full" onClick={() => setEmailMode(true)}>Tiếp tục bằng email</button>
      </> : <form className="email-form" onSubmit={submit}>
        <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Mật khẩu<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {mode === 'login' && <div className="form-row"><span /><button type="button" className="text-button" onClick={forgotPassword}>Quên mật khẩu?</button></div>}
        <button className="primary-button full" disabled={busy}>{busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</button>
        <button type="button" className="back-email" onClick={() => setEmailMode(false)}><ArrowLeft size={14} /> Quay lại</button>
      </form>}
      {error && <p className="form-message error">{error}</p>}{message && <p className="form-message success">{message}</p>}
      <p className="auth-switch">{mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setMessage('') }}>{mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}</button></p>
      <p className="terms">Khi tiếp tục, bạn đồng ý với Điều khoản và Chính sách quyền riêng tư của Mora.</p>
    </div></section>
  </div>
}
