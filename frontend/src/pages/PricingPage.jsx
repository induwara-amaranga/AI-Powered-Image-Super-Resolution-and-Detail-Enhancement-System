import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPlans } from '../api/billingApi.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { DemoBillingNotice, formatMoney } from '../components/AccountBits.jsx'

const FAQ = [
  {
    q: 'Is this a real payment?',
    a: 'No. Billing in this app is a demo. Checkout simulates a payment, creates a mock invoice and switches your plan. No card is charged and no card number is sent to the server.',
  },
  {
    q: 'What counts toward my monthly limit?',
    a: 'Each image you submit counts once, whether from the website or the API. Jobs that fail do not count. The counter resets on the 1st of each month (UTC).',
  },
  {
    q: 'Why is 5x a paid feature if the model is 4x?',
    a: 'SwinIR produces a 4x result. 5x adds a high-quality LANCZOS resize on top, which is handy for print sizes but does not add new detail beyond 4x.',
  },
  {
    q: 'Can I cancel any time?',
    a: 'Yes. Cancelling keeps your plan until the end of the period you paid for, then moves you to Free. You can resume before then.',
  },
]

export default function PricingPage() {
  const { status, plan: currentPlan, user } = useAuth()
  const [plans, setPlans] = useState([])
  const [cycle, setCycle] = useState('monthly')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPlans()
      .then((d) => setPlans(d.plans))
      .catch((e) => setError(e.message))
  }, [])

  const signedIn = status === 'authenticated'

  function cta(p) {
    const isCurrent = signedIn && currentPlan?.id === p.id && (p.id === 'free' || user?.billingCycle === cycle)
    if (isCurrent) {
      return { label: 'Current plan', to: '/account?tab=billing', disabled: true }
    }
    if (p.id === 'free') {
      return signedIn
        ? { label: 'Manage plan', to: '/account?tab=billing' }
        : { label: 'Start free', to: '/signup' }
    }
    const to = `/checkout/${p.id}?cycle=${cycle}`
    return signedIn
      ? { label: currentPlan?.id === p.id ? `Switch to ${cycle}` : `Upgrade to ${p.name}`, to }
      : { label: `Get ${p.name}`, to: `/signup?next=${encodeURIComponent(to)}` }
  }

  return (
    <main className="max-w-container-max mx-auto px-md md:px-lg py-xl">
      <div className="text-center max-w-2xl mx-auto mb-lg">
        <h1 className="font-display-lg text-[40px] md:text-display-lg text-on-surface mb-sm">
          Simple plans for <span className="text-gradient">sharper images</span>
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Start free. Upgrade when you need more images, 5x output or API access.
        </p>
      </div>

      <DemoBillingNotice className="max-w-3xl mx-auto mb-lg" />

      <div className="flex justify-center mb-lg">
        <div className="inline-flex rounded-full border border-outline-variant/60 bg-white p-1 shadow-sm" role="tablist">
          {['monthly', 'yearly'].map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={cycle === c}
              onClick={() => setCycle(c)}
              className={`px-md py-xs rounded-full font-body-sm text-body-sm font-semibold transition-colors ${
                cycle === c ? 'btn-gradient' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {c === 'monthly' ? 'Monthly' : 'Yearly · 2 months free'}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-center text-error mb-md">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg items-stretch">
        {plans.map((p) => {
          const featured = p.id === 'pro'
          const price = cycle === 'yearly' ? p.priceYearly : p.priceMonthly
          const action = cta(p)
          return (
            <div
              key={p.id}
              className={`relative rounded-2xl p-lg flex flex-col bg-white ${
                featured ? 'border-2 border-primary shadow-[0_24px_60px_-24px_rgba(79,70,229,0.45)]' : 'border border-outline-variant/60 shadow-sm'
              }`}
            >
              {featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 btn-gradient rounded-full px-sm py-0.5 text-[12px] font-bold">
                  Most popular
                </span>
              )}
              <h2 className="font-headline-sm text-headline-sm mb-1">{p.name}</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-md min-h-[42px]">{p.tagline}</p>
              <div className="mb-md">
                <span className="text-[40px] font-bold tracking-tight text-on-surface">{formatMoney(price)}</span>
                <span className="text-on-surface-variant"> / {cycle === 'yearly' ? 'year' : 'month'}</span>
                {cycle === 'yearly' && p.priceMonthly > 0 && (
                  <p className="font-body-sm text-body-sm text-emerald-700">
                    {formatMoney(p.priceMonthly * 12 - p.priceYearly)} saved vs monthly
                  </p>
                )}
              </div>
              <ul className="space-y-sm mb-lg flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-xs font-body-sm text-body-sm">
                    <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                    {f}
                  </li>
                ))}
              </ul>
              {action.disabled ? (
                <span className="w-full py-sm rounded-xl border border-outline-variant text-center font-semibold text-on-surface-variant">
                  {action.label}
                </span>
              ) : (
                <Link
                  to={action.to}
                  className={`w-full py-sm rounded-xl text-center font-semibold transition-all ${
                    featured ? 'btn-gradient hover:brightness-110' : 'border border-primary/40 text-primary hover:bg-primary-fixed/60'
                  }`}
                >
                  {action.label}
                </Link>
              )}
            </div>
          )
        })}
      </div>

      <section className="max-w-3xl mx-auto mt-xl">
        <h2 className="font-headline-sm text-headline-sm mb-md text-center">Questions</h2>
        <div className="space-y-sm">
          {FAQ.map((item) => (
            <details key={item.q} className="glass-panel rounded-xl p-md group">
              <summary className="cursor-pointer font-semibold list-none flex justify-between items-center">
                {item.q}
                <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
              </summary>
              <p className="mt-sm text-on-surface-variant font-body-sm text-body-sm">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  )
}
