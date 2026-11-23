import { apiFetch } from './http.js'

// All billing is a mock: no payment provider is involved.
export const fetchPlans = () => apiFetch('/api/billing/plans')
export const fetchSubscription = () => apiFetch('/api/billing/subscription')
export const checkout = (planId, billingCycle, card) =>
  apiFetch('/api/billing/checkout', { method: 'POST', body: { planId, billingCycle, card } })
export const cancelSubscription = () => apiFetch('/api/billing/cancel', { method: 'POST' })
export const resumeSubscription = () => apiFetch('/api/billing/resume', { method: 'POST' })
