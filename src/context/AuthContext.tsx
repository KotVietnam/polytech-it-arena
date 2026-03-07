/* eslint-disable react-refresh/only-export-components */
import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiGetMe, apiLogin } from '../api/client'
import type { AuthUser } from '../types'

interface AuthContextValue {
  isAuthorized: boolean
  isGuest: boolean
  user: AuthUser | null
  token: string | null
  isAuthLoading: boolean
  authorize: (
    username: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  authorizeAsGuest: () => void
  logout: () => void
  refreshMe: () => Promise<void>
}

interface SessionPayload {
  token: string
  user: AuthUser
}

const SESSION_KEY = 'polytech-it-arena-auth-session'
const LOCAL_TOKEN = '__local_guest__'
const GUEST_IS_ADMIN =
  import.meta.env.DEV || import.meta.env.VITE_GUEST_ADMIN === 'true'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

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
      Array.isArray(parsed.user.pointHistory)
    ) {
      return parsed
    }
  } catch {
    return null
  }

  return null
}

const createLocalGuestUser = (): AuthUser => ({
  id: 'guest-local',
  username: 'GUEST',
  firstName: null,
  lastName: null,
  displayName: 'Гостевой режим',
  email: null,
  phoneNumber: null,
  telegramContact: null,
  telegramLinked: false,
  telegramUsername: null,
  role: GUEST_IS_ADMIN ? 'ADMIN' : 'USER',
  totalPoints: 0,
  registrations: [],
  pointHistory: [],
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
              user: response.user,
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
      setState({
        token: response.token,
        user: response.user,
      })
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

  const refreshMe: AuthContextValue['refreshMe'] = useCallback(async () => {
    const currentToken = state?.token
    if (!currentToken || currentToken === LOCAL_TOKEN) {
      return
    }

    const response = await apiGetMe(currentToken)
    setState((previous) => {
      if (!previous) {
        return previous
      }

      return {
        token: previous.token,
        user: response.user,
      }
    })
  }, [state?.token])

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
      refreshMe,
    }),
    [state, isAuthLoading, refreshMe],
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
