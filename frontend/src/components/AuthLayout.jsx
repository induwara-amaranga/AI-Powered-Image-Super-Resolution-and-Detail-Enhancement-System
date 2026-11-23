import { useState } from 'react'
import { Link } from 'react-router-dom'

const HIGHLIGHTS = ['1x to 5x upscale', 'Detail enhancement', 'Denoise & sharpen', 'Job history']

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="min-h-screen">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden lg:flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#eef2ff] via-[#faf5ff] to-[#fdf2f8] px-16 py-12">
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-300/40 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-fuchsia-300/30 blur-3xl" />

          <div className="relative z-10 max-w-xl">
            <Link to="/" className="mb-8 inline-flex items-center gap-xs text-2xl font-bold">
              <span className="w-9 h-9 rounded-lg btn-gradient flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px] text-white">auto_awesome</span>
              </span>
              <span className="text-gradient">ImageSR</span>
            </Link>

            <h1 className="mb-5 text-5xl font-bold leading-tight text-slate-900">
              Turn blurry photos into <span className="text-gradient">crisp, high-res images</span>
            </h1>
            <p className="mb-8 text-lg leading-8 text-slate-600">
              SwinIR super-resolution recovers detail that ordinary resizing can&apos;t. Your
              account keeps every result in one place.
            </p>

            <div className="flex flex-wrap gap-3">
              {HIGHLIGHTS.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white px-6 py-12 lg:px-16">
          <div className="w-full max-w-md">
            <Link to="/" className="lg:hidden mb-8 inline-flex items-center gap-xs text-xl font-bold">
              <span className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] text-white">auto_awesome</span>
              </span>
              <span className="text-gradient">ImageSR</span>
            </Link>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
              <p className="mt-2 text-slate-600">{subtitle}</p>
            </div>
            {children}
            {footer && <p className="mt-8 text-center text-slate-600">{footer}</p>}
          </div>
        </section>
      </div>
    </main>
  )
}

export const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

export function FormError({ children }) {
  if (!children) return null
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {children}
    </div>
  )
}

export function PasswordInput({ id, name, value, onChange, placeholder = '••••••••', autoComplete }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`${inputClass} pr-16`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 hover:text-indigo-600"
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}
