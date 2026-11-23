const TOKEN_KEY = 'imagesr.token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token, remember = true) {
  try {
    clearToken()
    ;(remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token)
  } catch {
    /* storage unavailable: the session lasts until reload */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message)
    this.status = status
    this.code = body?.code
    this.body = body
  }
}

/** fetch wrapper: adds the bearer token, sends/parses JSON, throws ApiError. */
export async function apiFetch(path, { method = 'GET', body, headers = {}, raw = false } = {}) {
  const token = getToken()
  const init = { method, headers: { ...headers } }
  if (token) init.headers.Authorization = `Bearer ${token}`
  if (body instanceof FormData) {
    init.body = body
  } else if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }

  const res = await fetch(path, init)

  if (res.status === 401 && token) {
    clearToken()
    window.dispatchEvent(new Event('imagesr:signed-out'))
  }

  if (raw) {
    if (!res.ok) throw new ApiError(`Request failed (${res.status})`, res.status)
    return res
  }

  const isJson = (res.headers.get('content-type') || '').includes('application/json')
  const data = isJson ? await res.json().catch(() => null) : null

  if (!res.ok) {
    const message =
      data?.message && data?.error && data.message !== data.error
        ? `${data.message} ${data.error}`
        : data?.message || data?.detail || data?.error || `Request failed (${res.status})`
    throw new ApiError(message, res.status, data)
  }
  return data
}
