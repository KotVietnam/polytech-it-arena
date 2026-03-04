import { useEffect, useState } from 'react'

export type Theme = 'red' | 'blue'

const STORAGE_KEY = 'polytech-it-arena-theme'

const isTheme = (value: string | null): value is Theme =>
  value === 'red' || value === 'blue'

const resolveInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'red'
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (isTheme(stored)) {
    return stored
  }

  return 'red'
}

const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute('data-theme', theme)
}

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((previousTheme) => (previousTheme === 'red' ? 'blue' : 'red'))
  }

  return { theme, toggleTheme }
}
