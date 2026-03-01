import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Level, TrackId } from '../types'

interface RegistrationEntry {
  id: string
  trackId: TrackId
  level: Level
  points: number
  date: string
}

interface UserProfile {
  username: string
  totalPoints: number
  registrations: RegistrationEntry[]
}

interface AuthContextValue {
  isAuthorized: boolean
  user: UserProfile | null
  authorize: (username: string) => void
  logout: () => void
  registerTrack: (trackId: TrackId, level: Level) => void
}

const SESSION_KEY = 'cyberclub-auth-session'

const levelPoints: Record<Level, number> = {
  Junior: 60,
  Middle: 95,
  Senior: 130,
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const parseSession = (raw: string | null): UserProfile | null => {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as UserProfile
    if (
      parsed &&
      typeof parsed.username === 'string' &&
      typeof parsed.totalPoints === 'number' &&
      Array.isArray(parsed.registrations)
    ) {
      return parsed
    }
  } catch {
    return null
  }

  return null
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(() =>
    parseSession(sessionStorage.getItem(SESSION_KEY)),
  )

  useEffect(() => {
    if (user) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
    } else {
      sessionStorage.removeItem(SESSION_KEY)
    }
  }, [user])

  const authorize = (username: string) => {
    const normalized = username.trim()
    if (!normalized) {
      return
    }
    setUser((previous) => {
      if (previous && previous.username === normalized) {
        return previous
      }
      return {
        username: normalized,
        totalPoints: 0,
        registrations: [],
      }
    })
  }

  const logout = () => {
    setUser(null)
  }

  const registerTrack = (trackId: TrackId, level: Level) => {
    setUser((previous) => {
      if (!previous) {
        return previous
      }

      const points = levelPoints[level]
      const newEntry: RegistrationEntry = {
        id: `${trackId}-${level}-${Date.now()}`,
        trackId,
        level,
        points,
        date: new Date().toISOString(),
      }

      return {
        ...previous,
        totalPoints: previous.totalPoints + points,
        registrations: [newEntry, ...previous.registrations].slice(0, 30),
      }
    })
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthorized: Boolean(user),
      user,
      authorize,
      logout,
      registerTrack,
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
