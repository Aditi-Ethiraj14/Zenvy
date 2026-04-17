// ============================================================
// api.js — Axios API Client
// ============================================================
// Central place for all backend API calls.
// Uses localStorage for auth token storage.
// ============================================================

import axios from 'axios'

// ── API Base URL ──────────────────────────────────────────────
// Priority:
//   1. VITE_API_URL env var (set on Render → Environment tab)
//   2. localhost:8000 (local dev)
// On Render frontend, set VITE_API_URL = https://your-backend.onrender.com
const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://zenvy-backend-sxkp.onrender.com')

const API = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

// Auto-attach JWT token to every request
API.interceptors.request.use(config => {
  const token = localStorage.getItem('zenvy_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Auth ─────────────────────────────────────────────────────
export const signup = (data) => API.post('/auth/signup', data)
export const login = (data) => API.post('/auth/login', data)
export const getMe = (userId) => API.get(`/auth/me?user_id=${userId}`)

// ── Risk ─────────────────────────────────────────────────────
export const assessRisk = (features, role) => API.post(`/risk/assess?role=${role}`, features)
export const getWeatherRisk = (city, role) => API.get(`/risk/weather/${city}?role=${role}`)
export const getRiskSnapshots = (city = 'Mumbai') => API.get(`/risk/snapshots?city=${city}`)

// ── Policy ───────────────────────────────────────────────────
export const buyPolicy = (userId, data) => API.post(`/policy/buy?user_id=${userId}`, data)
export const getActivePolicy = (userId) => API.get(`/policy/active/${userId}`)
export const getPolicyHistory = (userId) => API.get(`/policy/history/${userId}`)

// ── Claims ───────────────────────────────────────────────────
export const fileClaim = (userId, data) => API.post(`/claims/file?user_id=${userId}`, data)
export const getClaimsHistory = (userId) => API.get(`/claims/history/${userId}`)
export const getAlerts = (userId) => API.get(`/claims/alerts/${userId}`)
export const markAlertRead = (alertId) => API.post(`/claims/alerts/${alertId}/read`)
export const triggerEvent = (data) => API.post('/claims/trigger', data)

// ── Admin ────────────────────────────────────────────────────
export const getAdminStats = () => API.get('/admin/stats')
export const getAllUsers = () => API.get('/admin/users')
export const getAllClaims = () => API.get('/admin/claims')
export const getMapData = () => API.get('/admin/map-data')
export const getFraudAlerts = () => API.get('/admin/fraud-alerts')
export const getAdminRiskTrend = () => API.get('/admin/risk-trend')
export const reviewClaim = (claimId, data) => API.post(`/admin/claims/${claimId}/review`, data)
export const getAdminNotifications = () => API.get('/admin/notifications')

export default API
