import { useState } from 'react'
import { interfaceLanguages, useLanguage } from '../context/LanguageContext'
import Brand from './Brand'

export default function LanguageWelcome() {
  const { language, setLanguage, hasChosen, t } = useLanguage()
  const [choice, setChoice] = useState(language)
  if (hasChosen) return null
  return <div className="language-welcome" role="dialog" aria-modal="true" aria-labelledby="welcome-language-title">
    <section className="glass-card language-welcome-panel"><Brand /><h1 id="welcome-language-title">{t.welcome} / Choose your language</h1>
      <p>English is the default · Tiếng Anh là ngôn ngữ mặc định</p>
      <div className="language-choice-grid">{interfaceLanguages.map(([code, name]) => <button key={code} type="button" className={choice === code ? 'selected' : ''} onClick={() => setChoice(code)} aria-pressed={choice === code}>{name}</button>)}</div>
      <p>{t.welcomeHint}</p><button className="primary-button full" onClick={() => setLanguage(choice)}>{t.continue}</button>
    </section>
  </div>
}
