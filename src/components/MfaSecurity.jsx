import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function MfaSecurity({ required = false, onVerified }) {
  const [factors, setFactors] = useState(null)
  const [enrollment, setEnrollment] = useState(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const load = useCallback(async () => {
    const result = await supabase.auth.mfa.listFactors()
    if (result.error) setMessage(result.error.message)
    else setFactors(result.data.totp || [])
  }, [])
  useEffect(() => { load() }, [load])
  async function enroll() {
    setBusy(true); setMessage('')
    const result = await supabase.auth.mfa.enroll({ factorType:'totp', friendlyName:'Mora authenticator' })
    if (result.error) setMessage(result.error.message); else setEnrollment(result.data)
    setBusy(false)
  }
  async function verify(event) {
    event.preventDefault(); setBusy(true); setMessage('')
    const factorId = enrollment?.id || factors?.find((item) => item.status === 'verified')?.id
    if (!factorId) { setMessage('Thiết lập ứng dụng xác thực trước.'); setBusy(false); return }
    const result = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
    setBusy(false)
    if (result.error) setMessage(result.error.message)
    else { setEnrollment(null); setCode(''); setMessage('Đã xác minh MFA cho phiên hiện tại.'); load(); onVerified?.() }
  }
  const verified = factors?.some((item) => item.status === 'verified')
  return <section className="glass-card settings-panel mfa-panel"><h2>{required ? 'Xác minh để truy cập quản trị' : 'Xác thực hai bước'}</h2><p>Dùng mã 6 số từ ứng dụng xác thực. Quyền quản trị được kiểm tra lại ở database.</p>{factors === null ? <p>Đang kiểm tra…</p> : <>{!verified && !enrollment && <button className="secondary-button" disabled={busy} onClick={enroll}>Thiết lập MFA</button>}{enrollment && <div className="mfa-enrollment"><img src={enrollment.totp.qr_code.startsWith('data:') ? enrollment.totp.qr_code : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(enrollment.totp.qr_code)}`} alt="Mã QR thiết lập MFA" /><details><summary>Nhập khóa thủ công</summary><code>{enrollment.totp.secret}</code></details><small>Giữ khóa này riêng tư và sao lưu trong trình quản lý mật khẩu.</small></div>}{(verified || enrollment) && <form onSubmit={verify}><label>Mã xác thực<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g,''))} /></label><button className="primary-button" disabled={busy || code.length !== 6}>{busy ? 'Đang xác minh…' : 'Xác minh'}</button></form>}</>}{message && <p role="status" className="form-message">{message}</p>}</section>
}
