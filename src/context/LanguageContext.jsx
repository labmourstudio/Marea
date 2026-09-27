import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const translations = {
  vi: { feed: 'Bảng tin', friends: 'Kết nối', worlds: 'Thế giới', projects: 'Khám phá dự án', learn: 'Học tập', profile: 'Hồ sơ', studio: 'Không gian của tôi', search: 'Tìm người sáng tạo và dự án', messages: 'Tin nhắn', notifications: 'Thông báo', signout: 'Đăng xuất' },
  en: { feed: 'Feed', friends: 'Connections', worlds: 'Worlds', projects: 'Explore projects', learn: 'Learn', profile: 'Profile', studio: 'My workspace', search: 'Search creators and projects', messages: 'Messages', notifications: 'Notifications', signout: 'Sign out' },
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('mayo-language') || localStorage.getItem('marea-language') || 'vi')
  useEffect(() => { localStorage.setItem('mayo-language', language); document.documentElement.lang = language }, [language])
  const value = useMemo(() => ({ language, setLanguage, toggle: () => setLanguage((current) => current === 'vi' ? 'en' : 'vi'), t: translations[language] }), [language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() { return useContext(LanguageContext) }
