import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'cyberclub-theme'

const isTheme = (value: string | null): value is Theme =>
  value === 'dark' || value === 'light'

const resolveInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (isTheme(stored)) {
    return stored
  }

  return 'dark'
}

const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.setAttribute('data-theme', theme)
}

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((previousTheme) => (previousTheme === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggleTheme }
}
