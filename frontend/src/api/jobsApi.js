import { apiFetch } from './http.js'

export function fetchJobs({ page = 1, limit = 12, status, q, days } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) params.set('status', status)
  if (q) params.set('q', q)
  if (days) params.set('days', String(days))
  return apiFetch(`/api/jobs?${params}`)
}

export const fetchJob = (jobId) => apiFetch(`/api/jobs/${encodeURIComponent(jobId)}`)
export const deleteJob = (jobId) => apiFetch(`/api/jobs/${encodeURIComponent(jobId)}`, { method: 'DELETE' })
export const clearHistory = () => apiFetch('/api/jobs', { method: 'DELETE' })
export const originalUrl = (jobId) => `/api/jobs/${encodeURIComponent(jobId)}/original`
