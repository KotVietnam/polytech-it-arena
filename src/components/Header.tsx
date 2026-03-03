import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Theme } from '../hooks/useTheme'
import { cn } from '../utils/cn'

interface HeaderProps {
  theme: Theme
  onToggleTheme: () => void
}

const navItems = [
  { to: '/home', label: 'Main' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/profile', label: 'Profile' },
  { to: '/newcomers', label: 'Newcomers' },
  { to: '/rules', label: 'Rules' },
  { to: '/archive', label: 'Archive' },
]

const navClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    'focus-ring mono px-3 py-2 text-xs transition-colors',
    isActive
      ? 'bg-red-600 text-black'
      : 'border border-zinc-700 text-zinc-200 hover:border-red-600 hover:text-red-300',
  )

export const Header = ({ theme, onToggleTheme }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <header className="border-b border-red-700/90 bg-black motion-safe:animate-reveal-up">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <NavLink
          to="/home"
          className="focus-ring border border-red-700 px-3 py-2 hover:bg-red-700/10"
        >
          <p className="mono text-[11px] text-red-400">[ SYSTEM_INIT ]</p>
          <p className="text-lg font-bold uppercase tracking-wide text-white">Cyber Club</p>
        </NavLink>

        <div className="flex items-center gap-2">
          {user ? (
            <p className="mono hidden border border-zinc-800 px-2 py-2 text-[11px] text-zinc-300 lg:block motion-safe:animate-slow-float">
              USER: {user.username}
            </p>
          ) : null}
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClassName}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              theme === 'dark'
                ? 'Переключить на светлую тему'
                : 'Переключить на темную тему'
            }
            className="focus-ring mono border border-zinc-700 px-3 py-2 text-xs text-zinc-200 hover:border-red-600 hover:text-red-300"
          >
            {theme === 'dark' ? 'LIGHT' : 'DARK'}
          </button>

          <button
            type="button"
            onClick={logout}
            aria-label="Выйти"
            className="focus-ring mono hidden border border-zinc-700 px-3 py-2 text-xs text-zinc-200 hover:border-red-600 hover:text-red-300 sm:inline-flex"
          >
            LOGOUT
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((previous) => !previous)}
            aria-label="Открыть меню"
            className="focus-ring mono border border-zinc-700 px-3 py-2 text-xs text-zinc-200 md:hidden"
          >
            MENU
          </button>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <nav className="mx-4 mb-4 grid gap-2 border border-red-800 bg-black p-3 md:hidden">
          {user ? (
            <p className="mono border border-zinc-800 px-3 py-2 text-xs text-zinc-300">
              USER: {user.username}
            </p>
          ) : null}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={navClassName}
              onClick={closeMobileMenu}
            >
              {item.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => {
              closeMobileMenu()
              logout()
            }}
            className="mono border border-zinc-700 px-3 py-2 text-left text-xs text-zinc-200 hover:border-red-600 hover:text-red-300"
          >
            LOGOUT
          </button>
        </nav>
      ) : null}
    </header>
  )
}
