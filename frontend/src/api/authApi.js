import { apiFetch } from './http.js'

export const signInUser = (email, password, remember = true) =>
  apiFetch('/api/auth/signin', { method: 'POST', body: { email, password, remember } })

export const signUpUser = (name, email, password) =>
  apiFetch('/api/auth/signup', { method: 'POST', body: { name, email, password } })

export const fetchMe = () => apiFetch('/api/auth/me')

export const updateProfile = (name) => apiFetch('/api/auth/me', { method: 'PATCH', body: { name } })

export const changePassword = (currentPassword, newPassword) =>
  apiFetch('/api/auth/password', { method: 'POST', body: { currentPassword, newPassword } })

export const createApiKey = () => apiFetch('/api/auth/api-key', { method: 'POST' })

export const revokeApiKey = () => apiFetch('/api/auth/api-key', { method: 'DELETE' })
