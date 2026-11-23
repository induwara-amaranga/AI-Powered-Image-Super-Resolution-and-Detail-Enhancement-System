import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { fetchMe, signInUser, signUpUser } from '../api/authApi.js'
import { clearToken, getToken, setToken } from '../api/http.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    status: getToken() ? 'loading' : 'anonymous',
    user: null,
    plan: null,
    usage: null,
  })

  const applySession = useCallback((data) => {
    setState((prev) => ({
      status: 'authenticated',
      user: data.user ?? prev.user,
      plan: data.plan ?? prev.plan,
      usage: data.usage ?? prev.usage,
    }))
  }, [])

  const signOut = useCallback(() => {
    clearToken()
    setState({ status: 'anonymous', user: null, plan: null, usage: null })
  }, [])

  const refresh = useCallback(async () => {
    if (!getToken()) return signOut()
    try {
      applySession(await fetchMe())
    } catch (err) {
      if (err.status === 401) signOut()
      else setState((prev) => ({ ...prev, status: prev.user ? 'authenticated' : 'anonymous' }))
    }
  }, [applySession, signOut])

  useEffect(() => {
    if (getToken()) refresh()
    const onSignedOut = () => signOut()
    window.addEventListener('imagesr:signed-out', onSignedOut)
    return () => window.removeEventListener('imagesr:signed-out', onSignedOut)
  }, [refresh, signOut])

  const signIn = useCallback(
    async (email, password, remember) => {
      const data = await signInUser(email, password, remember)
      setToken(data.token, remember)
      applySession(data)
      return data
    },
    [applySession]
  )

  const signUp = useCallback(
    async (name, email, password) => {
      const data = await signUpUser(name, email, password)
      setToken(data.token, true)
      applySession(data)
      return data
    },
    [applySession]
  )

  const value = useMemo(
    () => ({ ...state, signIn, signUp, signOut, refresh, applySession }),
    [state, signIn, signUp, signOut, refresh, applySession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export function RequireAuth({ children }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <main className="min-h-[60vh] flex items-center justify-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin mr-xs">progress_activity</span>
        Loading your account…
      </main>
    )
  }
  if (status !== 'authenticated') {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/signin?next=${next}`} replace />
  }
  return children
}

/** Only allow same-site relative redirects after sign-in. */
export function safeNext(search, fallback = '/') {
  const next = new URLSearchParams(search).get('next')
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback
}
