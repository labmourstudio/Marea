import { useRef, useState } from 'react'
import { Camera, Check, ChevronLeft, ChevronRight, Palette, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Brand from '../components/Brand'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { publicStorageUrl, supabase, uploadOwnedImage } from '../lib/supabase'
import { pendingInvite } from '../lib/pendingInvite'

const roles = ['Writer', 'Game Designer', 'Artist', 'Illustrator', 'Worldbuilder', 'Learner']
const genres = ['Fantasy', 'Sci-fi', 'Horror', 'Romance', 'RPG', 'MOBA', 'Comic', 'Visual Novel']

export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { language } = useLanguage()
  const vi = language === 'vi'
  const navigate = useNavigate()
  const avatarInput = useRef(null)
  const coverInput = useRef(null)
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ display_name: profile?.display_name || '', username: profile?.username || '', bio: profile?.bio || '', roles: [], languages: [language === 'vi' ? 'Vietnamese' : 'English'], interests: [], avatar_path: null, cover_path: null })

  function toggle(field, value) {
    setForm((current) => ({ ...current, [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value] }))
  }

  async function upload(field, bucket, file) {
    if (!file) return
    setBusy(true); setError('')
    try { const path = await uploadOwnedImage(bucket, user.id, file); setForm((current) => ({ ...current, [field]: path })) } catch (uploadError) { setError(uploadError.message) } finally { setBusy(false) }
  }

  async function finish() {
    setBusy(true); setError('')
    try {
      const username = form.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
      if (!form.display_name.trim() || username.length < 3) throw new Error(vi ? 'Tên hiển thị và username từ 3 ký tự là bắt buộc.' : 'A display name and username of at least 3 characters are required.')
      const { error: updateError } = await supabase.from('profiles').update({ ...form, display_name: form.display_name.trim(), username, onboarding_completed: true, updated_at: new Date().toISOString() }).eq('id', user.id)
      if (updateError) throw updateError
      await refreshProfile(); navigate(pendingInvite() || '/feed', { replace: true })
    } catch (saveError) { setError(saveError.message) } finally { setBusy(false) }
  }

  return <div className="onboarding-shell"><span className="aurora onboard-a" /><span className="aurora onboard-b" /><div className="onboard-progress"><span style={{ width: `${step * 33.33}%` }} /></div>
    <header className="onboard-header"><Brand /><div className="onboard-tools"><span>{vi ? 'Bước' : 'Step'} {step} / 3</span></div></header>
    <section className="onboard-card glass-card">
      {step === 1 && <><div className="onboard-heading"><span className="step-icon"><UserRound /></span><h1>{vi ? 'Tạo hồ sơ sáng tạo' : 'Set up your creator profile'}</h1><p>{vi ? 'Thông tin này sẽ xuất hiện trong portfolio công khai của bạn.' : 'This information will appear on your public portfolio.'}</p></div>
        <div className="cover-upload"><div className="cover-gradient" style={form.cover_path ? { backgroundImage: `url(${publicStorageUrl('covers', form.cover_path)})`, backgroundSize: 'cover' } : undefined} /><button onClick={() => coverInput.current.click()}><Camera /> Ảnh bìa</button><input ref={coverInput} type="file" accept="image/*" hidden onChange={(event) => upload('cover_path', 'covers', event.target.files[0])} /><button className="avatar-upload" onClick={() => avatarInput.current.click()} style={form.avatar_path ? { backgroundImage: `url(${publicStorageUrl('avatars', form.avatar_path)})`, backgroundSize: 'cover' } : undefined}><span><Camera /></span></button><input ref={avatarInput} type="file" accept="image/*" hidden onChange={(event) => upload('avatar_path', 'avatars', event.target.files[0])} /></div>
        <div className="field-grid"><label>{vi ? 'Tên hiển thị' : 'Display name'}<input value={form.display_name} onChange={(event) => setForm({ ...form, display_name: event.target.value })} required /></label><label>Username<div className="prefix-input"><span>@</span><input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required /></div></label><label className="span-2">{vi ? 'Giới thiệu' : 'Bio'}<textarea value={form.bio} maxLength="300" onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label></div></>}
      {step === 2 && <><div className="onboard-heading"><span className="step-icon"><Palette /></span><h1>{vi ? 'Bạn sáng tạo theo cách nào?' : 'How do you create?'}</h1><p>{vi ? 'Chọn vai trò và ngôn ngữ phù hợp. Bạn có thể thay đổi sau.' : 'Choose your role and languages. You can update them later.'}</p></div><div className="selection-area"><p className="selection-label">{vi ? 'Vai trò sáng tạo' : 'Creative roles'}</p><div className="select-grid">{roles.map((role) => <button key={role} className={form.roles.includes(role) ? 'selected' : ''} onClick={() => toggle('roles', role)}>{role}{form.roles.includes(role) && <Check className="select-check" />}</button>)}</div><p className="selection-label second">{vi ? 'Ngôn ngữ' : 'Languages'}</p><div className="language-pills">{['Vietnamese', 'English', 'Bilingual', 'Other'].map((item) => <button key={item} className={form.languages.includes(item) ? 'active' : ''} onClick={() => toggle('languages', item)}>{item}</button>)}</div></div></>}
      {step === 3 && <><div className="onboard-heading"><span className="step-icon"><Check /></span><h1>{vi ? 'Chọn chủ đề yêu thích' : 'Choose your interests'}</h1><p>{vi ? 'Mora dùng lựa chọn này để lọc nội dung thật phù hợp khi cộng đồng phát triển.' : 'Mora uses your interests to help you explore real community content.'}</p></div><div className="selection-area"><div className="genre-cloud">{genres.map((genre) => <button key={genre} className={form.interests.includes(genre) ? 'selected' : ''} onClick={() => toggle('interests', genre)}>{genre}</button>)}</div></div></>}
      {error && <p className="form-message error">{error}</p>}<footer className="onboard-actions"><button className="secondary-button" disabled={step === 1 || busy} onClick={() => setStep(step - 1)}><ChevronLeft /> {vi ? 'Quay lại' : 'Back'}</button>{step < 3 ? <button className="primary-button" disabled={busy || (step === 1 && (!form.display_name || !form.username))} onClick={() => setStep(step + 1)}>{vi ? 'Tiếp tục' : 'Continue'} <ChevronRight /></button> : <button className="primary-button" disabled={busy} onClick={finish}>{busy ? vi ? 'Đang lưu…' : 'Saving…' : vi ? 'Hoàn tất hồ sơ' : 'Finish profile'} <Check /></button>}</footer>
    </section>
  </div>
}
