import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { changePassword, createApiKey, revokeApiKey, updateProfile } from '../api/authApi.js'
import { cancelSubscription, fetchSubscription, resumeSubscription } from '../api/billingApi.js'
import { DemoBillingNotice, PlanBadge, UsageMeter, formatDate, formatMoney } from '../components/AccountBits.jsx'
import { inputClass, PasswordInput } from '../components/AuthLayout.jsx'

const TABS = [
  { id: 'profile', label: 'Profile', icon: 'person' },
  { id: 'billing', label: 'Plan & billing', icon: 'credit_card' },
  { id: 'api', label: 'API key', icon: 'key' },
]

function Notice({ tone = 'ok', children }) {
  if (!children) return null
  return (
    <p
      role="status"
      className={`rounded-lg px-sm py-xs font-body-sm text-body-sm ${
        tone === 'error' ? 'bg-error-container text-error' : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      {children}
    </p>
  )
}

function Card({ title, children, className = '' }) {
  return (
    <section className={`glass-panel rounded-2xl p-lg ${className}`}>
      {title && <h2 className="font-headline-sm text-headline-sm mb-md">{title}</h2>}
      {children}
    </section>
  )
}

function ProfileTab() {
  const { user, applySession } = useAuth()
  const [name, setName] = useState(user.name)
  const [nameMsg, setNameMsg] = useState(null)
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState(null)
  const [busy, setBusy] = useState(null)

  const saveName = async (e) => {
    e.preventDefault()
    setBusy('name')
    try {
      applySession(await updateProfile(name.trim()))
      setNameMsg({ tone: 'ok', text: 'Name updated.' })
    } catch (err) {
      setNameMsg({ tone: 'error', text: err.message })
    } finally {
      setBusy(null)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (pw.next !== pw.confirm) return setPwMsg({ tone: 'error', text: 'New passwords do not match.' })
    setBusy('pw')
    try {
      await changePassword(pw.current, pw.next)
      setPw({ current: '', next: '', confirm: '' })
      setPwMsg({ tone: 'ok', text: 'Password changed.' })
    } catch (err) {
      setPwMsg({ tone: 'error', text: err.message })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
      <Card title="Profile">
        <form onSubmit={saveName} className="space-y-md">
          <div>
            <label htmlFor="acc-name" className="mb-2 block text-sm font-semibold">
              Name
            </label>
            <input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">Email</label>
            <input value={user.email} disabled className={`${inputClass} bg-surface-container text-on-surface-variant`} />
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Member since {formatDate(user.createdAt)}</p>
          <Notice tone={nameMsg?.tone}>{nameMsg?.text}</Notice>
          <button disabled={busy === 'name' || !name.trim() || name.trim() === user.name} className="px-lg py-sm rounded-xl btn-gradient font-semibold disabled:opacity-50">
            {busy === 'name' ? 'Saving…' : 'Save'}
          </button>
        </form>
      </Card>

      <Card title="Change password">
        <form onSubmit={savePassword} className="space-y-md">
          <div>
            <label htmlFor="pw-current" className="mb-2 block text-sm font-semibold">
              Current password
            </label>
            <PasswordInput id="pw-current" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" />
          </div>
          <div>
            <label htmlFor="pw-next" className="mb-2 block text-sm font-semibold">
              New password
            </label>
            <PasswordInput id="pw-next" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="pw-confirm" className="mb-2 block text-sm font-semibold">
              Confirm new password
            </label>
            <PasswordInput id="pw-confirm" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" />
          </div>
          <Notice tone={pwMsg?.tone}>{pwMsg?.text}</Notice>
          <button disabled={busy === 'pw'} className="px-lg py-sm rounded-xl btn-gradient font-semibold disabled:opacity-50">
            {busy === 'pw' ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </Card>
    </div>
  )
}

function BillingTab() {
  const { user, plan, usage, applySession } = useAuth()
  const [invoices, setInvoices] = useState(null)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const d = await fetchSubscription()
      applySession(d)
      setInvoices(d.invoices)
    } catch (err) {
      setMsg({ tone: 'error', text: err.message })
    }
  }, [applySession])

  useEffect(() => {
    load()
  }, [load])

  const act = async (fn, okText) => {
    setBusy(true)
    try {
      applySession(await fn())
      setMsg({ tone: 'ok', text: okText })
    } catch (err) {
      setMsg({ tone: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const paid = plan?.id !== 'free'

  return (
    <div className="space-y-lg">
      <DemoBillingNotice />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <Card>
          <div className="flex items-center justify-between mb-md">
            <h2 className="font-headline-sm text-headline-sm">Current plan</h2>
            <PlanBadge planId={plan?.id} />
          </div>
          <p className="text-[32px] font-bold tracking-tight">
            {plan?.name}
            {paid && (
              <span className="text-body-md font-normal text-on-surface-variant">
                {' '}
                · {formatMoney(user.billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly)}/
                {user.billingCycle === 'yearly' ? 'year' : 'month'}
              </span>
            )}
          </p>
          {paid && (
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
              {user.planCancelAt
                ? `Cancelled. Your plan stays active until ${formatDate(user.planCancelAt)}, then moves to Free.`
                : `Renews ${formatDate(user.planRenewsAt)}.`}
            </p>
          )}
          <div className="flex flex-wrap gap-sm mt-md">
            <Link to="/pricing" className="px-lg py-sm rounded-xl btn-gradient font-semibold">
              {paid ? 'Change plan' : 'Upgrade'}
            </Link>
            {paid && !user.planCancelAt && (
              <button
                disabled={busy}
                onClick={() =>
                  window.confirm('Cancel your subscription? You keep your plan until the end of the current period.') &&
                  act(cancelSubscription, 'Subscription cancelled.')
                }
                className="px-lg py-sm rounded-xl border border-outline-variant font-semibold text-on-surface-variant hover:border-error hover:text-error disabled:opacity-50"
              >
                Cancel subscription
              </button>
            )}
            {paid && user.planCancelAt && (
              <button
                disabled={busy}
                onClick={() => act(resumeSubscription, 'Subscription resumed.')}
                className="px-lg py-sm rounded-xl border border-primary/40 text-primary font-semibold hover:bg-primary-fixed/60 disabled:opacity-50"
              >
                Resume subscription
              </button>
            )}
          </div>
          <div className="mt-md">
            <Notice tone={msg?.tone}>{msg?.text}</Notice>
          </div>
        </Card>

        <Card title="Usage">
          <UsageMeter usage={usage} plan={plan} />
          <dl className="grid grid-cols-2 gap-md mt-md font-body-sm text-body-sm">
            <div>
              <dt className="text-on-surface-variant">Resets</dt>
              <dd className="font-semibold">{formatDate(usage?.periodEnd)}</dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">Max upscale</dt>
              <dd className="font-semibold">{plan?.maxScale}x</dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">API access</dt>
              <dd className="font-semibold">{plan?.apiAccess ? 'Included' : 'Pro and above'}</dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">WebP export</dt>
              <dd className="font-semibold">{plan?.webpExport ? 'Included' : 'Pro and above'}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card title="Invoices">
        {invoices === null ? (
          <div className="h-24 rounded-lg bg-surface-container animate-pulse" />
        ) : invoices.length === 0 ? (
          <p className="text-on-surface-variant">No invoices yet. You&apos;re on the Free plan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead className="text-on-surface-variant border-b border-outline-variant/50">
                <tr>
                  <th className="py-xs pr-md font-semibold">Date</th>
                  <th className="py-xs pr-md font-semibold">Invoice</th>
                  <th className="py-xs pr-md font-semibold">Plan</th>
                  <th className="py-xs pr-md font-semibold">Card</th>
                  <th className="py-xs pr-md font-semibold text-right">Amount</th>
                  <th className="py-xs font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-outline-variant/30 last:border-0">
                    <td className="py-sm pr-md whitespace-nowrap">{formatDate(inv.createdAt)}</td>
                    <td className="py-sm pr-md font-code-md text-[13px]">{inv.number}</td>
                    <td className="py-sm pr-md capitalize">
                      {inv.plan} · {inv.billingCycle}
                    </td>
                    <td className="py-sm pr-md capitalize whitespace-nowrap">
                      {inv.card ? `${inv.card.brand} •••• ${inv.card.last4}` : 'Auto-renewal'}
                    </td>
                    <td className="py-sm pr-md text-right">{formatMoney(inv.amount, inv.currency)}</td>
                    <td className="py-sm">
                      <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[12px] font-semibold">
                        Paid (demo)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function ApiTab() {
  const { user, plan, applySession } = useAuth()
  const [newKey, setNewKey] = useState(null)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const generate = async () => {
    if (user.apiKey && !window.confirm('Generate a new key? The current key stops working immediately.')) return
    setBusy(true)
    setMsg(null)
    try {
      const d = await createApiKey()
      applySession({ user: d.user })
      setNewKey(d.apiKey)
    } catch (err) {
      setMsg({ tone: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const revoke = async () => {
    if (!window.confirm('Revoke this API key? Apps using it will stop working.')) return
    setBusy(true)
    try {
      const d = await revokeApiKey()
      applySession({ user: d.user })
      setNewKey(null)
      setMsg({ tone: 'ok', text: 'API key revoked.' })
    } catch (err) {
      setMsg({ tone: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(newKey)
      setMsg({ tone: 'ok', text: 'Key copied.' })
    } catch {
      window.prompt('Copy your API key', newKey)
    }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'

  if (!plan?.apiAccess) {
    return (
      <Card title="API key">
        <p className="text-on-surface-variant mb-md">
          The REST API lets you enhance images from scripts and apps with an API key. It&apos;s
          included with the Pro and Business plans.
        </p>
        <Link to="/pricing" className="inline-flex px-lg py-sm rounded-xl btn-gradient font-semibold">
          See plans
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-lg">
      <Card title="API key">
        {newKey ? (
          <div className="space-y-sm">
            <p className="font-body-sm text-body-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-sm py-xs">
              Copy this key now. For your security it won&apos;t be shown again.
            </p>
            <div className="flex gap-sm">
              <code className="flex-1 truncate rounded-lg bg-surface-container px-sm py-sm font-code-md text-[13px]">{newKey}</code>
              <button onClick={copy} className="px-md rounded-lg border border-primary/40 text-primary font-semibold hover:bg-primary-fixed/60">
                Copy
              </button>
            </div>
          </div>
        ) : user.apiKey ? (
          <p className="text-on-surface-variant">
            Active key <code className="font-code-md text-on-surface">{user.apiKey.prefix}…</code>, created{' '}
            {formatDate(user.apiKey.createdAt, true)}.
          </p>
        ) : (
          <p className="text-on-surface-variant">You don&apos;t have an API key yet.</p>
        )}
        <div className="flex flex-wrap gap-sm mt-md">
          <button disabled={busy} onClick={generate} className="px-lg py-sm rounded-xl btn-gradient font-semibold disabled:opacity-50">
            {user.apiKey ? 'Regenerate key' : 'Generate key'}
          </button>
          {user.apiKey && (
            <button
              disabled={busy}
              onClick={revoke}
              className="px-lg py-sm rounded-xl border border-outline-variant font-semibold text-on-surface-variant hover:border-error hover:text-error disabled:opacity-50"
            >
              Revoke
            </button>
          )}
        </div>
        <div className="mt-md">
          <Notice tone={msg?.tone}>{msg?.text}</Notice>
        </div>
      </Card>

      <Card title="Quick start">
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-sm">
          Submit a job, poll its status, then download the PNG. API jobs count toward the same monthly
          limit and appear in your history.
        </p>
        <pre className="rounded-xl bg-slate-900 text-slate-100 p-md overflow-x-auto font-code-md text-[13px] leading-relaxed">
{`# 1. Submit
curl -X POST "${origin}/enhance?scale=4&denoise=false&sharpen=true" \\
  -H "X-API-Key: ${newKey ?? 'YOUR_API_KEY'}" \\
  -F "file=@photo.jpg"
# → {"job_id": "…", "status_url": "/status/…", "result_url": "/result/…"}

# 2. Poll until "status" is SUCCESS or FAILURE
curl "${origin}/status/JOB_ID"

# 3. Download
curl -o enhanced.png "${origin}/result/JOB_ID"`}
        </pre>
        <Link to="/docs#rest-api" className="inline-block mt-sm text-primary font-semibold hover:underline">
          Full API reference →
        </Link>
      </Card>
    </div>
  )
}

export default function AccountPage() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'profile'
  const { user } = useAuth()

  return (
    <main className="max-w-container-max mx-auto px-md md:px-lg py-xl">
      <div className="mb-lg">
        <h1 className="font-display-lg text-[40px] md:text-display-lg text-on-surface mb-xs">Account</h1>
        <p className="text-on-surface-variant">Signed in as {user.email}</p>
      </div>

      <div className="flex gap-xs mb-lg border-b border-outline-variant/50 overflow-x-auto" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setParams({ tab: t.id })}
            className={`flex items-center gap-xs px-md py-sm -mb-px border-b-2 font-semibold whitespace-nowrap transition-colors ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab />}
      {tab === 'billing' && <BillingTab />}
      {tab === 'api' && <ApiTab />}
    </main>
  )
}
