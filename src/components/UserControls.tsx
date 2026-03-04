import { Link } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

interface UserControlsProps {
  username?: string | null
  isGuest?: boolean
  profileAriaLabel?: string
  profileTitle?: string
}

export const UserControls = ({
  username,
  isGuest = false,
  profileAriaLabel = 'Открыть профиль',
  profileTitle = 'Открыть профиль',
}: UserControlsProps) => {
  const normalizedUsername = username?.trim() || 'UNKNOWN'
  const avatarLetter = normalizedUsername.charAt(0).toUpperCase() || '?'

  return (
    <div className="bm-user-controls">
      {isGuest ? (
        <div className="bm-user-chip bm-guest-chip mono" aria-label="Гостевой режим">
          <div className="bm-user-text">ГОСТЕВОЙ РЕЖИМ</div>
        </div>
      ) : (
        <Link
          to="/profile"
          className="bm-user-chip bm-user-chip-button mono"
          aria-label={profileAriaLabel}
          title={profileTitle}
        >
          <div className="bm-avatar" aria-hidden="true">
            {avatarLetter}
          </div>
          <div className="bm-user-text">USER: {normalizedUsername}</div>
        </Link>
      )}

      <ThemeToggle className="bm-theme-toggle-inline" />
    </div>
  )
}
