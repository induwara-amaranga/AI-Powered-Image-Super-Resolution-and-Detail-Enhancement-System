import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout, { FormError, PasswordInput, inputClass } from '../components/AuthLayout.jsx'
import { safeNext, useAuth } from '../auth/AuthContext.jsx'

function passwordProblem(pw) {
  if (pw.length < 8) return 'Use at least 8 characters.'
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Include at least one letter and one number.'
  return null
}

export default function SignUp() {
  const { signUp, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const next = safeNext(location.search, '/')

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', terms: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (status === 'authenticated' && !loading) return <Navigate to={next} replace />

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const pwHint = form.password ? passwordProblem(form.password) : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const problem = passwordProblem(form.password)
    if (problem) return setError(problem)
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')
    if (!form.terms) return setError('Please agree to the Terms and Privacy Policy.')

    setLoading(true)
    try {
      await signUp(form.name.trim(), form.email.trim(), form.password)
      navigate(next, { replace: true })
    } catch (err) {
      setError(err.message || 'Sign up failed.')
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free plan includes 15 images a month. No card needed."
      footer={
        <>
          Already have an account?{' '}
          <Link to={`/signin${location.search}`} className="font-bold text-indigo-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormError>{error}</FormError>

        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700">
            Full name
          </label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            required
            maxLength={80}
            placeholder="Your name"
            className={inputClass}
          />
        </div>

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
          <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
            Password
          </label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
          />
          <p className={`mt-2 text-sm ${pwHint ? 'text-amber-700' : 'text-slate-500'}`}>
            {pwHint || (form.password ? 'Looks good.' : 'At least 8 characters, with a letter and a number.')}
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-700">
            Confirm password
          </label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
          />
        </div>

        <label className="flex items-start text-sm text-slate-600">
          <input
            name="terms"
            type="checkbox"
            checked={form.terms}
            onChange={handleChange}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="ml-2">
            I agree to the{' '}
            <Link to="/terms" target="_blank" className="font-semibold text-indigo-600 hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" target="_blank" className="font-semibold text-indigo-600 hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl btn-gradient px-4 py-3.5 font-bold transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}
