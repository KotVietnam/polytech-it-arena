import { useTheme } from '../hooks/useTheme'

interface ThemeToggleProps {
  className?: string
}

export const ThemeToggle = ({ className = '' }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme()
  const isRed = theme === 'red'

  return (
    <button
      type="button"
      className={`bm-theme-toggle mono ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={isRed ? 'Переключить на Blue тему' : 'Переключить на Red тему'}
      title={isRed ? 'Переключить на Blue тему' : 'Переключить на Red тему'}
    >
      {isRed ? 'BLUE THEME >>' : 'RED THEME >>'}
    </button>
  )
}
