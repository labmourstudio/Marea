import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Brand from '../components/Brand'
import { supabase } from '../lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (updateError) setError(updateError.message); else navigate('/feed')
  }
  return <div className="auth-shell single-panel"><section className="auth-panel-wrap"><form className="auth-panel glass-card email-form" onSubmit={submit}><Brand /><h1>Đặt mật khẩu mới</h1><label>Mật khẩu mới<input type="password" minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <p className="form-message error">{error}</p>}<button className="primary-button full" disabled={busy}>{busy ? 'Đang lưu…' : 'Cập nhật mật khẩu'}</button></form></section></div>
}

