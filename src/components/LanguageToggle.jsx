import { useLanguage } from '../context/LanguageContext'

export default function LanguageToggle({ glass = false }) {
  const { language, toggle } = useLanguage()
  return <button className={`language-toggle${glass ? ' glass' : ''}`} onClick={toggle} aria-label="Đổi ngôn ngữ / Switch language"><span className={language !== 'vi' ? 'lang-muted' : ''}>VI</span><span className="lang-divider" /><span className={language !== 'en' ? 'lang-muted' : ''}>EN</span></button>
}

