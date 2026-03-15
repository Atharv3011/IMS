import axios from 'axios'

const rawApiUrl = import.meta.env.VITE_API_URL?.trim()

export const API_URL = rawApiUrl
  ? rawApiUrl.replace(/\/$/, '')
  : '/api'

axios.defaults.baseURL = API_URL

export default axios