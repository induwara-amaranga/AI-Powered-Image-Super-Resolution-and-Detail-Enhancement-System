import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout, { FormError, PasswordInput, inputClass } from '../components/AuthLayout.jsx'
import { safeNext, useAuth } from '../auth/AuthContext.jsx'

export default function SignIn() {
  const { signIn, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const next = safeNext(location.search, '/')

  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showResetNote, setShowResetNote] = useState(false)

  if (status === 'authenticated' && !loading) return <Navigate to={next} replace />

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(form.email.trim(), form.password, form.remember)
      navigate(next, { replace: true })
    } catch (err) {
      setError(err.message || 'Sign in failed.')
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue enhancing your photos."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link
            to={`/signup${location.search}`}
            className="font-bold text-indigo-600 hover:underline"
          >
            Sign up free
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
        <FormError>{error}</FormError>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="name@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowResetNote((v) => !v)}
              className="text-sm font-semibold text-indigo-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
          />
          {showResetNote && (
            <p className="mt-2 text-sm text-slate-500">
              Email password reset isn&apos;t available yet. If you&apos;re signed in on another
              device, change your password from Account → Profile.
            </p>
          )}
        </div>

        <label className="flex items-center text-sm text-slate-600">
          <input
            name="remember"
            type="checkbox"
            checked={form.remember}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="ml-2">Keep me signed in for 30 days</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl btn-gradient px-4 py-3.5 font-bold transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  )
}
