import { Link } from 'react-router-dom'

const PLAN_STYLES = {
  free: 'bg-surface-container text-on-surface-variant border-outline-variant/60',
  pro: 'bg-primary-fixed text-primary border-primary-fixed-dim',
  business: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
}

export function PlanBadge({ planId = 'free' }) {
  const label = { free: 'Free', pro: 'Pro', business: 'Business' }[planId] ?? planId
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
        PLAN_STYLES[planId] ?? PLAN_STYLES.free
      }`}
    >
      {label}
    </span>
  )
}

export function UsageMeter({ usage, plan, compact = false }) {
  if (!usage) return null
  const pct = Math.min(100, (usage.used / usage.limit) * 100)
  const low = usage.remaining <= Math.max(2, usage.limit * 0.1)
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          {compact ? 'Images this month' : `${plan?.name ?? ''} plan · images this month`}
        </span>
        <span className={`font-body-sm text-body-sm font-semibold ${low ? 'text-error' : 'text-on-surface'}`}>
          {usage.used} / {usage.limit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
        <div
          className={`h-full rounded-full ${low ? 'bg-error' : 'bg-gradient-to-r from-primary to-secondary-container'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {low && plan?.id !== 'business' && (
        <p className="mt-1.5 font-body-sm text-body-sm text-on-surface-variant">
          {usage.remaining === 0 ? 'Monthly limit reached. ' : `${usage.remaining} left. `}
          <Link to="/pricing" className="font-semibold text-primary hover:underline">
            Upgrade
          </Link>
        </p>
      )}
    </div>
  )
}

export function DemoBillingNotice({ className = '' }) {
  return (
    <div
      className={`flex gap-sm items-start rounded-xl border border-amber-200 bg-amber-50 px-md py-sm text-amber-900 ${className}`}
    >
      <span className="material-symbols-outlined text-[20px] mt-0.5">science</span>
      <p className="font-body-sm text-body-sm">
        <b>Demo billing.</b> Payments are simulated: no card is charged and card numbers never
        leave your browser. Use test card <code className="font-code-md">4242 4242 4242 4242</code>{' '}
        (or one ending in <code className="font-code-md">0002</code> to see a decline).
      </p>
    </div>
  )
}

export function formatDate(value, withTime = false) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  })
}

export function formatMoney(amount, currency = 'USD') {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
