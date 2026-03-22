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

axios.defaults.baseURL = API_URL

export default axios