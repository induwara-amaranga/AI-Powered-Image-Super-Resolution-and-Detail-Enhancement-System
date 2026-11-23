import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { PlanBadge } from './AccountBits.jsx'

const LINKS = [
  { label: 'Enhance', to: '/', exact: true },
  { label: 'History', to: '/history', matchPaths: ['/history', '/job'] },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Pricing', to: '/pricing', matchPaths: ['/pricing', '/checkout'] },
  { label: 'Docs', to: '/docs' },
]

function UserMenu() {
  const { user, plan, usage, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const go = (to) => {
    setOpen(false)
    navigate(to)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-xs rounded-full border border-outline-variant/60 bg-white pl-1 pr-sm py-1 hover:border-primary/50 transition-colors"
      >
        <span className="w-8 h-8 rounded-full btn-gradient flex items-center justify-center text-[13px] font-bold">
          {initials}
        </span>
        <PlanBadge planId={plan?.id} />
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">expand_more</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-xl border border-outline-variant/60 bg-white shadow-xl p-sm z-50"
        >
          <div className="px-sm py-xs">
            <p className="font-semibold text-on-surface truncate">{user.name}</p>
            <p className="text-body-sm text-on-surface-variant truncate">{user.email}</p>
          </div>
          {usage && (
            <div className="px-sm py-xs">
              <div className="flex justify-between text-body-sm text-on-surface-variant mb-1">
                <span>This month</span>
                <span className="font-medium text-on-surface">
                  {usage.used} / {usage.limit}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary-container"
                  style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
                />
              </div>
            </div>
          )}
          <div className="my-xs h-px bg-outline-variant/50" />
          {[
            { icon: 'person', label: 'Account', to: '/account' },
            { icon: 'credit_card', label: 'Plan & billing', to: '/account?tab=billing' },
            { icon: 'key', label: 'API key', to: '/account?tab=api' },
            { icon: 'history', label: 'History', to: '/history' },
          ].map((item) => (
            <button
              key={item.label}
              role="menuitem"
              onClick={() => go(item.to)}
              className="w-full flex items-center gap-sm px-sm py-xs rounded-lg text-left hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <div className="my-xs h-px bg-outline-variant/50" />
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false)
              signOut()
              navigate('/')
            }}
            className="w-full flex items-center gap-sm px-sm py-xs rounded-lg text-left text-error hover:bg-error-container"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default function TopNav() {
  const { pathname } = useLocation()
  const { status } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => setMobileOpen(false), [pathname])

  const isActive = (link) => {
    if (link.exact) return pathname === link.to
    if (link.matchPaths) return link.matchPaths.some((p) => pathname.startsWith(p))
    return pathname.startsWith(link.to)
  }

  const linkClass = (active) =>
    active
      ? 'text-primary font-semibold font-body-md text-body-md'
      : 'text-on-surface-variant font-medium hover:text-on-surface transition-colors font-body-md text-body-md'

  return (
    <header className="bg-white/75 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/50 w-full">
      <nav className="flex justify-between items-center w-full px-md md:px-lg py-sm max-w-container-max mx-auto">
        <div className="flex items-center gap-md">
          <Link to="/" className="flex items-center gap-xs font-display-md text-headline-sm font-bold">
            <span className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-white">auto_awesome</span>
            </span>
            <span className="text-gradient">ImageSR</span>
          </Link>

          <div className="hidden md:flex gap-md ml-lg">
            {LINKS.map((link) => (
              <NavLink key={link.label} to={link.to} className={linkClass(isActive(link))}>
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-sm">
          {status === 'authenticated' ? (
            <UserMenu />
          ) : status === 'loading' ? (
            <span className="w-24 h-9 rounded-full bg-surface-container animate-pulse" />
          ) : (
            <>
              <Link
                to="/signin"
                className="hidden sm:inline-block px-md py-xs font-body-sm text-body-sm font-semibold text-on-surface-variant hover:text-on-surface"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="px-md py-xs btn-gradient rounded-lg font-body-sm text-body-sm font-bold hover:brightness-110 active:scale-95 transition-all"
              >
                Get started
              </Link>
            </>
          )}
          <button
            type="button"
            className="md:hidden p-xs rounded-lg hover:bg-surface-container"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-outline-variant/50 bg-white px-md py-sm flex flex-col gap-xs">
          {LINKS.map((link) => (
            <NavLink key={link.label} to={link.to} className={`py-xs ${linkClass(isActive(link))}`}>
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}
