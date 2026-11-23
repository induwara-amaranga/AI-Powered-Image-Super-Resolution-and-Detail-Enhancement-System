import { apiFetch } from './http.js'

export async function enhanceImage(file, { scale, denoise, sharpen }) {
  const form = new FormData()
  form.append('file', file)
  const params = new URLSearchParams({
    scale: String(scale),
    denoise: String(denoise),
    sharpen: String(sharpen),
  })
  return apiFetch(`/enhance?${params}`, { method: 'POST', body: form })
}

export async function getJobStatus(jobId) {
  const res = await fetch(`/status/${encodeURIComponent(jobId)}`)
  if (!res.ok) throw new Error(`Status failed (${res.status})`)
  return res.json()
}

export function getResultUrl(jobId) {
  return `/result/${encodeURIComponent(jobId)}`
}

export async function fetchResultBlob(jobId) {
  const res = await fetch(getResultUrl(jobId))
  if (!res.ok) throw new Error(`Result failed (${res.status})`)
  return res.blob()
}
