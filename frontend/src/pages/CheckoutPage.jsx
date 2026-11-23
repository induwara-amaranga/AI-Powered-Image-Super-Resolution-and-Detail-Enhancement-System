import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { checkout, fetchPlans } from '../api/billingApi.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { DemoBillingNotice, formatMoney } from '../components/AccountBits.jsx'

// ---- card helpers (all client-side; the full number never leaves the browser)
function detectBrand(digits) {
  if (/^4/.test(digits)) return 'visa'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard'
  if (/^3[47]/.test(digits)) return 'amex'
  if (/^6(011|5)/.test(digits)) return 'discover'
  return 'card'
}

function luhnValid(digits) {
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i])
    if (double) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    double = !double
  }
  return digits.length >= 12 && sum % 10 === 0
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 19)
  if (/^3[47]/.test(digits)) {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(' ')
  }
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

function expiryValid(value) {
  const m = /^(\d{2})\/(\d{2})$/.exec(value)
  if (!m) return false
  const month = Number(m[1])
  const year = 2000 + Number(m[2])
  if (month < 1 || month > 12) return false
  const now = new Date()
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)
}

const BRAND_LABEL = { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex', discover: 'Discover', card: 'Card' }

export default function CheckoutPage() {
  const { planId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const cycle = searchParams.get('cycle') === 'yearly' ? 'yearly' : 'monthly'
  const navigate = useNavigate()
  const { user, applySession } = useAuth()

  const [plans, setPlans] = useState(null)
  const [form, setForm] = useState({ name: user?.name ?? '', number: '', expiry: '', cvc: '' })
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(null)

  useEffect(() => {
    fetchPlans()
      .then((d) => setPlans(d.plans))
      .catch((e) => setError(e.message))
  }, [])

  const plan = plans?.find((p) => p.id === planId)
  const digits = form.number.replace(/\D/g, '')
  const brand = detectBrand(digits)
  const cvcLen = brand === 'amex' ? 4 : 3

  const problems = useMemo(() => {
    const p = {}
    if (!form.name.trim()) p.name = 'Enter the name on the card.'
    if (!luhnValid(digits)) p.number = 'Enter a valid card number.'
    if (!expiryValid(form.expiry)) p.expiry = 'Enter a future date as MM/YY.'
    if (form.cvc.length !== cvcLen) p.cvc = `Enter the ${cvcLen}-digit security code.`
    return p
  }, [form, digits, cvcLen])

  if (plans && (!plan || plan.id === 'free')) {
    return (
      <main className="max-w-xl mx-auto px-md py-xl text-center">
        <h1 className="font-headline-sm text-headline-sm mb-sm">That plan doesn&apos;t exist</h1>
        <Link to="/pricing" className="text-primary font-semibold hover:underline">
          Back to pricing
        </Link>
      </main>
    )
  }

  const price = plan ? (cycle === 'yearly' ? plan.priceYearly : plan.priceMonthly) : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched(true)
    setError(null)
    if (Object.keys(problems).length) return
    setSubmitting(true)
    try {
      // Only brand + last 4 are sent. Never the full number, expiry or CVC.
      const result = await checkout(plan.id, cycle, { brand, last4: digits.slice(-4) })
      applySession(result)
      setDone(result)
    } catch (err) {
      setError(err.message || 'Payment failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const field = (name) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-on-surface outline-none transition focus:ring-2 focus:ring-primary/30 ${
      touched && problems[name] ? 'border-error' : 'border-outline-variant focus:border-primary'
    }`

  if (done) {
    return (
      <main className="max-w-xl mx-auto px-md py-xl">
        <div className="glass-panel rounded-2xl p-lg text-center">
          <span className="inline-flex w-16 h-16 rounded-full bg-emerald-50 items-center justify-center mb-md">
            <span className="material-symbols-outlined text-4xl text-emerald-600">check_circle</span>
          </span>
          <h1 className="font-headline-sm text-headline-sm mb-xs">You&apos;re on {done.plan.name}!</h1>
          <p className="text-on-surface-variant mb-md">
            Mock invoice <b>{done.invoice.number}</b> for {formatMoney(done.invoice.amount)} was recorded. Your
            new limit is {done.usage.limit} images a month
            {done.plan.maxScale > 4 ? ', with 5x upscaling' : ''}.
          </p>
          <div className="flex justify-center gap-sm">
            <button onClick={() => navigate('/')} className="px-lg py-sm rounded-xl btn-gradient font-semibold">
              Start enhancing
            </button>
            <Link to="/account?tab=billing" className="px-lg py-sm rounded-xl border border-primary/40 text-primary font-semibold hover:bg-primary-fixed/60">
              View billing
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-container-max mx-auto px-md md:px-lg py-xl">
      <Link to="/pricing" className="inline-flex items-center gap-1 mb-md font-body-sm text-body-sm text-on-surface-variant hover:text-primary">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to pricing
      </Link>
      <h1 className="font-display-md text-display-md mb-md">Checkout</h1>
      <DemoBillingNotice className="mb-lg" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg items-start">
        <form onSubmit={handleSubmit} className="lg:col-span-3 glass-panel rounded-2xl p-lg space-y-md" autoComplete="off" noValidate>
          <h2 className="font-headline-sm text-headline-sm">Payment details</h2>

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="cc-name" className="mb-2 block text-sm font-semibold text-on-surface">
              Name on card
            </label>
            <input
              id="cc-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={field('name')}
              autoComplete="off"
            />
            {touched && problems.name && <p className="mt-1 text-sm text-error">{problems.name}</p>}
          </div>

          <div>
            <label htmlFor="cc-number" className="mb-2 block text-sm font-semibold text-on-surface">
              Card number
            </label>
            <div className="relative">
              <input
                id="cc-number"
                inputMode="numeric"
                placeholder="4242 4242 4242 4242"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: formatCardNumber(e.target.value) })}
                className={`${field('number')} pr-24 font-code-md tracking-wider`}
                autoComplete="off"
              />
              {digits && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-surface-container px-2 py-0.5 text-[12px] font-bold text-on-surface-variant">
                  {BRAND_LABEL[brand]}
                </span>
              )}
            </div>
            {touched && problems.number && <p className="mt-1 text-sm text-error">{problems.number}</p>}
          </div>

          <div className="grid grid-cols-2 gap-md">
            <div>
              <label htmlFor="cc-exp" className="mb-2 block text-sm font-semibold text-on-surface">
                Expiry
              </label>
              <input
                id="cc-exp"
                inputMode="numeric"
                placeholder="MM/YY"
                value={form.expiry}
                onChange={(e) => setForm({ ...form, expiry: formatExpiry(e.target.value) })}
                className={`${field('expiry')} font-code-md`}
                autoComplete="off"
              />
              {touched && problems.expiry && <p className="mt-1 text-sm text-error">{problems.expiry}</p>}
            </div>
            <div>
              <label htmlFor="cc-cvc" className="mb-2 block text-sm font-semibold text-on-surface">
                CVC
              </label>
              <input
                id="cc-cvc"
                inputMode="numeric"
                placeholder={brand === 'amex' ? '1234' : '123'}
                value={form.cvc}
                onChange={(e) => setForm({ ...form, cvc: e.target.value.replace(/\D/g, '').slice(0, cvcLen) })}
                className={`${field('cvc')} font-code-md`}
                autoComplete="off"
              />
              {touched && problems.cvc && <p className="mt-1 text-sm text-error">{problems.cvc}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !plan}
            className="w-full rounded-xl btn-gradient px-4 py-3.5 font-bold transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-xs"
          >
            <span className={`material-symbols-outlined ${submitting ? 'animate-spin' : ''}`}>
              {submitting ? 'progress_activity' : 'lock'}
            </span>
            {submitting ? 'Processing…' : `Pay ${formatMoney(price)} (demo)`}
          </button>
          <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
            Simulated payment. Nothing is charged.
          </p>
        </form>

        <aside className="lg:col-span-2 glass-panel rounded-2xl p-lg space-y-md">
          <h2 className="font-headline-sm text-headline-sm">Order summary</h2>
          {plan ? (
            <>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">ImageSR {plan.name}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Billed {cycle} · renews automatically
                  </p>
                </div>
                <p className="font-semibold">{formatMoney(price)}</p>
              </div>
              <div className="inline-flex rounded-full border border-outline-variant/60 p-1">
                {['monthly', 'yearly'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSearchParams({ cycle: c })}
                    className={`px-sm py-0.5 rounded-full text-[13px] font-semibold ${cycle === c ? 'btn-gradient' : 'text-on-surface-variant'}`}
                  >
                    {c === 'monthly' ? 'Monthly' : 'Yearly'}
                  </button>
                ))}
              </div>
              <ul className="space-y-xs">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-xs font-body-sm text-body-sm">
                    <span className="material-symbols-outlined text-[18px] text-primary">check</span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="pt-md border-t border-outline-variant/50 flex justify-between font-semibold">
                <span>Due today</span>
                <span>{formatMoney(price)}</span>
              </div>
            </>
          ) : (
            <div className="h-40 rounded-lg bg-surface-container animate-pulse" />
          )}
        </aside>
      </div>
    </main>
  )
}
