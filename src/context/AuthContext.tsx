/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiGetMe, apiLogin } from '../api/client'
import type { AuthUser, Level, TrackId } from '../types'

interface RegistrationEntry {
  id: string
  trackId: TrackId
  level: Level
  points: number
  date: string
}

interface UserProfile extends AuthUser {
  totalPoints: number
  registrations: RegistrationEntry[]
}

interface AuthContextValue {
  isAuthorized: boolean
  isGuest: boolean
  user: UserProfile | null
  token: string | null
  isAuthLoading: boolean
  authorize: (
    username: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  authorizeAsGuest: () => void
  logout: () => void
  registerTrack: (trackId: TrackId, level: Level) => void
}

interface SessionPayload {
  token: string
  user: UserProfile
}

const SESSION_KEY = 'cyberclub-auth-session'
const LOCAL_TOKEN = '__local_guest__'

const levelPoints: Record<Level, number> = {
  Junior: 60,
  Middle: 95,
  Senior: 130,
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const isValidRegistration = (value: unknown): value is RegistrationEntry => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.trackId === 'string' &&
    typeof candidate.level === 'string' &&
    typeof candidate.points === 'number' &&
    typeof candidate.date === 'string'
  )
}

const parseSession = (raw: string | null): SessionPayload | null => {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as SessionPayload
    if (
      parsed &&
      typeof parsed.token === 'string' &&
      parsed.user &&
      typeof parsed.user.id === 'string' &&
      typeof parsed.user.username === 'string' &&
      typeof parsed.user.role === 'string' &&
      typeof parsed.user.totalPoints === 'number' &&
      Array.isArray(parsed.user.registrations) &&
      parsed.user.registrations.every(isValidRegistration)
    ) {
      return parsed
    }
  } catch {
    return null
  }

  return null
}

const mergeWithProgress = (serverUser: AuthUser, previous: UserProfile | null): UserProfile => {
  if (!previous || previous.username !== serverUser.username) {
    return {
      ...serverUser,
      totalPoints: 0,
      registrations: [],
    }
  }

  return {
    ...serverUser,
    totalPoints: previous.totalPoints,
    registrations: previous.registrations,
  }
}

const createLocalGuestUser = (): UserProfile => ({
  id: 'guest-local',
  username: 'GUEST',
  displayName: 'Гостевой режим',
  email: null,
  role: 'USER',
  totalPoints: 0,
  registrations: [],
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<SessionPayload | null>(() =>
    parseSession(sessionStorage.getItem(SESSION_KEY)),
  )
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  useEffect(() => {
    if (state) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state))
    } else {
      sessionStorage.removeItem(SESSION_KEY)
    }
  }, [state])

  useEffect(() => {
    const token = state?.token
    if (!token || token === LOCAL_TOKEN) {
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        const response = await apiGetMe(token)
        if (!cancelled) {
          setState((previous) => {
            if (!previous) {
              return previous
            }

            return {
              token: previous.token,
              user: mergeWithProgress(response.user, previous.user),
            }
          })
        }
      } catch {
        if (!cancelled) {
          setState(null)
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [state?.token])

  const authorize: AuthContextValue['authorize'] = async (username, password) => {
    const normalized = username.trim()
    if (!normalized || !password.trim()) {
      return { ok: false, error: 'Введите логин и пароль.' }
    }

    setIsAuthLoading(true)
    try {
      const response = await apiLogin(normalized, password)
      setState((previous) => ({
        token: response.token,
        user: mergeWithProgress(response.user, previous?.user ?? null),
      }))
      return { ok: true }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Ошибка авторизации'
      return { ok: false, error: message }
    } finally {
      setIsAuthLoading(false)
    }
  }

  const authorizeAsGuest = () => {
    setState({
      token: LOCAL_TOKEN,
      user: createLocalGuestUser(),
    })
  }

  const logout = () => {
    setState(null)
  }

  const registerTrack = (trackId: TrackId, level: Level) => {
    setState((previous) => {
      const baseState: SessionPayload =
        previous ?? {
          token: LOCAL_TOKEN,
          user: createLocalGuestUser(),
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
        token: baseState.token,
        user: {
          ...baseState.user,
          totalPoints: baseState.user.totalPoints + points,
          registrations: [newEntry, ...baseState.user.registrations].slice(0, 30),
        },
      }
    })
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthorized: Boolean(state?.token && state.user),
      isGuest: state?.token === LOCAL_TOKEN,
      user: state?.user ?? null,
      token: state?.token ?? null,
      isAuthLoading,
      authorize,
      authorizeAsGuest,
      logout,
      registerTrack,
    }),
    [state, isAuthLoading],
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
