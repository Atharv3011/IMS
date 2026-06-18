import axios from 'axios'

const rawApiUrl = import.meta.env.VITE_API_URL?.trim()
const rawBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim()

const normalizeApiUrl = (value) => {
  if (!value) {
    return '/api'
  }

  const trimmed = value.replace(/\/$/, '')

  if (trimmed === '/api' || trimmed.endsWith('/api')) {
    return trimmed
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return `${trimmed}/api`
  }

  return '/api'
}

export const API_URL = normalizeApiUrl(rawApiUrl)

const normalizeBackendOrigin = () => {
  if (rawBackendUrl) {
    return rawBackendUrl.replace(/\/$/, '')
  }

  if (rawApiUrl && (rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://'))) {
    return rawApiUrl.replace(/\/$/, '').replace(/\/api$/, '')
  }

  return ''
}

export const BACKEND_ORIGIN = normalizeBackendOrigin()

export const buildApiUrl = (path) => {
  const safePath = path.startsWith('/') ? path : `/${path}`
  return `${API_URL}${safePath}`
}

// Keep baseURL empty because most calls already use API_URL explicitly.
// This avoids accidental /api/api/... URLs in deployed environments.
axios.defaults.baseURL = ''

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const message = error?.response?.data?.message || ''

    const isExpiredOrInvalidToken =
      status === 401 && /(token|authorization denied|user not found|no token)/i.test(message)

    if (isExpiredOrInvalidToken) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete axios.defaults.headers.common.Authorization

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default axios