import { Link } from 'react-router-dom'
import { interfaceLanguages, useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage()
  const { mode, setMode } = useTheme()
  return <div className="content-page settings-page"><section className="page-hero simple"><div><span className="eyebrow purple">MORA · SETTINGS</span><h1>{t.settings}</h1><p>{language === 'vi' ? 'Chọn cách Mora hiển thị trên thiết bị của bạn.' : 'Choose how Mora looks on your device.'}</p></div></section>
    <section className="glass-card settings-panel"><h2>{t.theme}</h2><p>{language === 'vi' ? 'Chế độ tối giảm vùng sáng trên màn hình OLED; mức tiết kiệm điện thực tế còn tùy thiết bị và độ sáng.' : 'Dark mode reduces bright areas on OLED screens. Power savings depend on the device and screen brightness.'}</p>
      <div className="settings-options">{['light','dark','system'].map((option) => <button type="button" key={option} onClick={() => setMode(option)} className={mode === option ? 'selected' : ''} aria-pressed={mode === option}>{t[option]}</button>)}</div></section>
    <section className="glass-card settings-panel"><h2>{t.language}</h2><p>{language === 'vi' ? 'Bài viết của người dùng không tự dịch; một số trang cũ đang tiếp tục được bản địa hóa.' : 'User content is never translated automatically; some legacy pages are still being localized.'}</p>
      <label className="settings-select">{t.language}<select value={language} onChange={(event) => setLanguage(event.target.value)}>{interfaceLanguages.map(([code,name]) => <option value={code} key={code}>{name}</option>)}</select></label>
    </section><Link className="secondary-button" to="/feed">{t.feed}</Link>
  </div>
}
