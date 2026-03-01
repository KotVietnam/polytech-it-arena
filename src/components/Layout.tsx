import { Outlet, useLocation } from 'react-router-dom'
import type { Theme } from '../hooks/useTheme'
import { Footer } from './Footer'
import { Header } from './Header'

interface LayoutProps {
  theme: Theme
  onToggleTheme: () => void
}

export const Layout = ({ theme, onToggleTheme }: LayoutProps) => {
  const location = useLocation()
  const isInfoHome = location.pathname === '/home'

  return (
    <div className="main-site-shell min-h-screen bg-bg text-text">
      <div
        aria-hidden="true"
        className="main-grid-drift pointer-events-none fixed inset-0 -z-10 opacity-[0.28]"
      />

      {!isInfoHome ? <Header theme={theme} onToggleTheme={onToggleTheme} /> : null}

      <main
        className={
          isInfoHome
            ? 'w-full py-0 motion-safe:animate-reveal-up'
            : 'mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 motion-safe:animate-reveal-up'
        }
      >
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
